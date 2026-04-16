import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppRole } from "@/constants/roles";
import { rpcCanAccessProfile } from "@/lib/auth/can-access-profile-rpc";
import { isOrgAdminRole } from "@/lib/users/actor-permissions";

export async function canReviewOwnerByHierarchy(
  supabase: SupabaseClient,
  actorProfileId: string,
  ownerUserId: string,
  role: AppRole | null
): Promise<boolean> {
  if (isOrgAdminRole(role) || role === "hos") return true;
  if (role !== "manager" && role !== "assistant_manager") return false;
  return rpcCanAccessProfile(supabase, actorProfileId, ownerUserId, role);
}
