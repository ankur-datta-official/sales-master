import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppRole } from "@/constants/roles";
import { toSafeActionError } from "@/lib/errors/safe-action-error";
import { isOrgAdminRole } from "@/lib/users/actor-permissions";

export type AssignableProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export async function assertCanAssignTargetByHierarchy(params: {
  supabase: SupabaseClient;
  actorProfileId: string;
  assigneeId: string;
  role: AppRole | null;
  canAssign: boolean;
  deniedMessage: string;
  fallbackMessage: string;
  context: string;
}): Promise<string | null> {
  const {
    supabase,
    actorProfileId,
    assigneeId,
    role,
    canAssign,
    deniedMessage,
    fallbackMessage,
    context,
  } = params;

  if (!canAssign) {
    return deniedMessage;
  }

  const hasOrgWide = isOrgAdminRole(role) || role === "hos";
  const { data, error } = await supabase.rpc("can_access_profile", {
    p_actor_profile_id: actorProfileId,
    p_target_profile_id: assigneeId,
    p_has_org_wide_access: hasOrgWide,
    p_max_depth: 25,
  });
  if (error) {
    return toSafeActionError(error, fallbackMessage, context);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !(typeof row === "object" && "can_access" in row && row.can_access)) {
    return "You cannot assign a target to this user based on your role and hierarchy.";
  }
  return null;
}

export async function loadAssignableProfilesByHierarchy(params: {
  supabase: SupabaseClient;
  organizationId: string;
  actorProfileId: string;
  role: AppRole | null;
  contextPrefix: string;
}): Promise<{ profiles: AssignableProfileRow[]; error: string | null }> {
  const { supabase, organizationId, actorProfileId, role, contextPrefix } = params;

  if (isOrgAdminRole(role) || role === "hos") {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("organization_id", organizationId)
      .order("full_name", { ascending: true });
    return {
      profiles: (data ?? []) as AssignableProfileRow[],
      error: error
        ? toSafeActionError(
            error,
            "Could not load assignable profiles.",
            `${contextPrefix}.loadAll`
          )
        : null,
    };
  }

  if (role === "manager") {
    const { data: subRows, error: subErr } = await supabase.rpc("get_subordinate_profile_ids", {
      p_root_profile_id: actorProfileId,
      p_include_self: true,
      p_max_depth: 25,
    });
    if (subErr) {
      return {
        profiles: [],
        error: toSafeActionError(
          subErr,
          "Could not load assignable profiles.",
          `${contextPrefix}.loadSubordinateIds`
        ),
      };
    }

    const ids = (subRows ?? []).map((r: { profile_id: string }) => r.profile_id);
    if (ids.length === 0) return { profiles: [], error: null };
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids)
      .order("full_name", { ascending: true });
    return {
      profiles: (data ?? []) as AssignableProfileRow[],
      error: error
        ? toSafeActionError(
            error,
            "Could not load assignable profiles.",
            `${contextPrefix}.loadSubordinateProfiles`
          )
        : null,
    };
  }

  return { profiles: [], error: null };
}
