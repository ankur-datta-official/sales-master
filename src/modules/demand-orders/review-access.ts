import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppRole } from "@/constants/roles";
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

  const { data, error } = await supabase.rpc("can_access_profile", {
    p_actor_profile_id: actorProfileId,
    p_target_profile_id: orderOwnerId,
    p_has_org_wide_access: false,
    p_max_depth: 25,
  });
  if (error) return false;
  const row = Array.isArray(data) ? data[0] : data;
  return Boolean(row && typeof row === "object" && "can_access" in row && row.can_access);
}
