import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppRole } from "@/constants/roles";
import { rpcCanAccessProfile } from "@/lib/auth/can-access-profile-rpc";
import { canReviewDemandOrders, isOrgAdminRole } from "@/lib/users/actor-permissions";

export async function canActorReviewDemandOrder(
  supabase: SupabaseClient,
  actorProfileId: string,
  orderOwnerId: string,
  role: AppRole | null
): Promise<boolean> {
  if (orderOwnerId === actorProfileId) return false;
  if (!canReviewDemandOrders(role)) return false;
  if (isOrgAdminRole(role) || role === "hos") return true;
  if (role !== "manager" && role !== "assistant_manager") return false;
  return rpcCanAccessProfile(supabase, actorProfileId, orderOwnerId, role);
}
