import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DEMAND_ORDER_STAGE,
  DEMAND_ORDER_STATUS,
  type DemandOrderStage,
  type DemandOrderStatus,
} from "@/constants/statuses";
import type { AppRole } from "@/constants/roles";
import { rpcCanAccessProfile } from "@/lib/auth/can-access-profile-rpc";
import { isOrgAdminRole } from "@/lib/users/actor-permissions";

/**
 * App-layer visibility aligned with `demand_orders_select_by_role_scope` RLS.
 */
export async function canActorViewDemandOrder(
  supabase: SupabaseClient,
  actorProfileId: string,
  actorOrganizationId: string,
  order: {
    organization_id: string;
    created_by_user_id: string;
    stage: DemandOrderStage;
    status: DemandOrderStatus;
  },
  role: AppRole | null
): Promise<boolean> {
  if (order.organization_id !== actorOrganizationId) return false;
  if (order.created_by_user_id === actorProfileId) return true;
  if (isOrgAdminRole(role) || role === "hos" || role === "accounts") return true;
  if (role === "factory_operator") {
    return (
      order.stage === DEMAND_ORDER_STAGE.factoryQueue &&
      order.status === DEMAND_ORDER_STATUS.sentToFactory
    );
  }
  if (role === "manager" || role === "assistant_manager") {
    return rpcCanAccessProfile(supabase, actorProfileId, order.created_by_user_id, role);
  }
  return false;
}
