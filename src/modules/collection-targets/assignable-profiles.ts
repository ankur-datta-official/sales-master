import type { AppRole } from "@/constants/roles";
import { toSafeActionError } from "@/lib/errors/safe-action-error";
import { createClient } from "@/lib/supabase/server";
import { isOrgAdminRole } from "@/lib/users/actor-permissions";

export type AssignableProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export async function loadAssignableProfilesForCollectionTargets(
  organizationId: string,
  actorProfileId: string,
  role: AppRole | null
): Promise<{ profiles: AssignableProfileRow[]; error: string | null }> {
  const supabase = await createClient();

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
            "collectionTargets.assignableProfiles.loadAll"
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
          "collectionTargets.assignableProfiles.loadSubordinateIds"
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
            "collectionTargets.assignableProfiles.loadSubordinateProfiles"
          )
        : null,
    };
  }

  return { profiles: [], error: null };
}
