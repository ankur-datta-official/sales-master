import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppRole } from "@/constants/roles";
import { isOrgAdminRole } from "@/lib/users/actor-permissions";

function parseCanAccessRow(data: unknown): boolean {
  const row = Array.isArray(data) ? data[0] : data;
  return Boolean(row && typeof row === "object" && "can_access" in row && (row as { can_access: boolean }).can_access);
}

/**
 * Same-org access: self, subordinate tree, or explicit org-wide (HOS / org admin).
 * Matches `public.can_access_profile` return shape and app conventions (e.g. demand-order review).
 */
export async function rpcCanAccessProfile(
  supabase: SupabaseClient,
  actorProfileId: string,
  targetProfileId: string,
  role: AppRole | null
): Promise<boolean> {
  if (actorProfileId === targetProfileId) return true;
  if (isOrgAdminRole(role) || role === "hos") return true;
  if (role !== "manager" && role !== "assistant_manager") return false;

  const { data, error } = await supabase.rpc("can_access_profile", {
    p_actor_profile_id: actorProfileId,
    p_target_profile_id: targetProfileId,
    p_has_org_wide_access: false,
    p_max_depth: 25,
  });
  if (error) return false;
  return parseCanAccessRow(data);
}
