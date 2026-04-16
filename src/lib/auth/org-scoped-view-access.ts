import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppRole } from "@/constants/roles";
import { rpcCanAccessProfile } from "@/lib/auth/can-access-profile-rpc";
import { isOrgAdminRole } from "@/lib/users/actor-permissions";

/**
 * Rows scoped by organization + a “subject” profile (assignee, seller, etc.).
 * Aligns with visit_plans / sales_entries / parties / sales_targets SELECT RLS patterns.
 */
export async function canActorViewOrgSubjectScopedRow(
  supabase: SupabaseClient,
  actorProfileId: string,
  actorOrganizationId: string,
  rowOrganizationId: string,
  subjectUserId: string | null,
  role: AppRole | null,
  options?: { accountsOrgWide?: boolean }
): Promise<boolean> {
  if (!actorOrganizationId || rowOrganizationId !== actorOrganizationId) return false;
  if (!subjectUserId) {
    return isOrgAdminRole(role) || role === "hos";
  }
  if (subjectUserId === actorProfileId) return true;
  if (isOrgAdminRole(role) || role === "hos") return true;
  if (options?.accountsOrgWide && role === "accounts") return true;
  if (role === "manager" || role === "assistant_manager") {
    return rpcCanAccessProfile(supabase, actorProfileId, subjectUserId, role);
  }
  return false;
}

/** `products_select_org_scope` — any authenticated role in the same org may read. */
export function canActorViewOrgProduct(
  actorOrganizationId: string,
  productOrganizationId: string
): boolean {
  return Boolean(actorOrganizationId && productOrganizationId === actorOrganizationId);
}

/**
 * Factory dispatch detail page + `demand_order_dispatches_select_by_role_scope` (with in-factory state enforced in UI).
 */
export async function canActorViewFactoryDispatchDetail(
  supabase: SupabaseClient,
  actorProfileId: string,
  actorOrganizationId: string,
  detail: {
    organization_id: string;
    created_by_user_id: string;
    order_stage: string;
    order_status: string;
  },
  role: AppRole | null
): Promise<boolean> {
  if (!actorOrganizationId || detail.organization_id !== actorOrganizationId) return false;
  if (detail.order_stage !== "factory_queue" || detail.order_status !== "sent_to_factory") {
    return false;
  }
  if (isOrgAdminRole(role) || role === "hos" || role === "accounts" || role === "factory_operator") {
    return true;
  }
  if (detail.created_by_user_id === actorProfileId) return true;
  if (role === "manager" || role === "assistant_manager") {
    return rpcCanAccessProfile(supabase, actorProfileId, detail.created_by_user_id, role);
  }
  return false;
}
