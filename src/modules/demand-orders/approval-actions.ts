"use server";

import { revalidatePath } from "next/cache";

import { APPROVAL_LOG_ACTION, DEMAND_ORDER_STAGE, DEMAND_ORDER_STATUS } from "@/constants/statuses";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { toSafeActionError } from "@/lib/errors/safe-action-error";
import { createClient } from "@/lib/supabase/server";
import { canReviewDemandOrders } from "@/lib/users/actor-permissions";
import {
  approveDemandOrderSchema,
  forwardDemandOrderSchema,
  rejectDemandOrderSchema,
  type ApproveDemandOrderInput,
  type ForwardDemandOrderInput,
  type RejectDemandOrderInput,
} from "@/modules/demand-orders/approval-schemas";
import { isAppRole } from "@/constants/roles";
import { canActorReviewDemandOrder } from "@/modules/demand-orders/review-access";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function approveDemandOrderAction(input: ApproveDemandOrderInput): Promise<ActionResult> {
  const parsed = approveDemandOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canReviewDemandOrders(role)) {
    return { ok: false, error: "You do not have permission to approve demand orders." };
  }
  if (!profile?.organization_id || !profile.id) {
    return { ok: false, error: "Your profile must belong to an organization." };
  }

  const { data: order } = await supabase
    .from("demand_orders")
    .select("id, organization_id, created_by_user_id, status, stage")
    .eq("id", parsed.data.demandOrderId)
    .maybeSingle();

  if (!order || order.organization_id !== profile.organization_id) {
    return { ok: false, error: "Demand order not found in your organization." };
  }
  if (order.created_by_user_id === profile.id) {
    return { ok: false, error: "You cannot approve your own order." };
  }
  if (order.stage !== DEMAND_ORDER_STAGE.managerReview) {
    return { ok: false, error: "This order is not in manager review." };
  }
  if (
    order.status !== DEMAND_ORDER_STATUS.submitted &&
    order.status !== DEMAND_ORDER_STATUS.underReview
  ) {
    return { ok: false, error: "Only submitted or under-review orders can be approved." };
  }

  const allowed = await canActorReviewDemandOrder(
    supabase,
    profile.id,
    order.created_by_user_id,
    role
  );
  if (!allowed) {
    return { ok: false, error: "You are outside the allowed review scope for this order." };
  }

  const note = (parsed.data.note ?? "").trim();

  const { data: logRow, error: logErr } = await supabase
    .from("approval_logs")
    .insert({
      organization_id: profile.organization_id,
      entity_type: "demand_order",
      entity_id: order.id,
      action: APPROVAL_LOG_ACTION.approve,
      from_user_id: null,
      to_user_id: null,
      acted_by_user_id: profile.id,
      note,
    })
    .select("id")
    .single();

  if (logErr || !logRow) {
    return {
      ok: false,
      error: toSafeActionError(logErr, "Could not record approval.", "demandOrders.approval.approve.insertLog"),
    };
  }

  const { data: updated, error: updErr } = await supabase
    .from("demand_orders")
    .update({
      status: DEMAND_ORDER_STATUS.approved,
      stage: DEMAND_ORDER_STAGE.accountsReview,
    })
    .eq("id", order.id)
    .eq("stage", DEMAND_ORDER_STAGE.managerReview)
    .in("status", [DEMAND_ORDER_STATUS.submitted, DEMAND_ORDER_STATUS.underReview])
    .select("id")
    .maybeSingle();

  if (updErr || !updated) {
    await supabase.from("approval_logs").delete().eq("id", logRow.id);
    return {
      ok: false,
      error: toSafeActionError(
        updErr,
        "Order could not be approved (it may have changed).",
        "demandOrders.approval.approve.updateOrder"
      ),
    };
  }

  revalidatePath(ROUTES.approvals);
  revalidatePath(ROUTES.accountsReview);
  revalidatePath(ROUTES.demandOrders);
  revalidatePath(`${ROUTES.demandOrders}/${order.id}`);
  return { ok: true };
}

export async function rejectDemandOrderAction(input: RejectDemandOrderInput): Promise<ActionResult> {
  const parsed = rejectDemandOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canReviewDemandOrders(role)) {
    return { ok: false, error: "You do not have permission to reject demand orders." };
  }
  if (!profile?.organization_id || !profile.id) {
    return { ok: false, error: "Your profile must belong to an organization." };
  }

  const { data: order } = await supabase
    .from("demand_orders")
    .select("id, organization_id, created_by_user_id, status, stage")
    .eq("id", parsed.data.demandOrderId)
    .maybeSingle();

  if (!order || order.organization_id !== profile.organization_id) {
    return { ok: false, error: "Demand order not found in your organization." };
  }
  if (order.created_by_user_id === profile.id) {
    return { ok: false, error: "You cannot reject your own order." };
  }
  if (order.stage !== DEMAND_ORDER_STAGE.managerReview) {
    return { ok: false, error: "This order is not in manager review." };
  }
  if (
    order.status !== DEMAND_ORDER_STATUS.submitted &&
    order.status !== DEMAND_ORDER_STATUS.underReview
  ) {
    return { ok: false, error: "Only submitted or under-review orders can be rejected." };
  }

  const allowed = await canActorReviewDemandOrder(
    supabase,
    profile.id,
    order.created_by_user_id,
    role
  );
  if (!allowed) {
    return { ok: false, error: "You are outside the allowed review scope for this order." };
  }

  const note = (parsed.data.note ?? "").trim();

  const { data: logRow, error: logErr } = await supabase
    .from("approval_logs")
    .insert({
      organization_id: profile.organization_id,
      entity_type: "demand_order",
      entity_id: order.id,
      action: APPROVAL_LOG_ACTION.reject,
      from_user_id: null,
      to_user_id: null,
      acted_by_user_id: profile.id,
      note,
    })
    .select("id")
    .single();

  if (logErr || !logRow) {
    return {
      ok: false,
      error: toSafeActionError(logErr, "Could not record rejection.", "demandOrders.approval.reject.insertLog"),
    };
  }

  const { data: updated, error: updErr } = await supabase
    .from("demand_orders")
    .update({
      status: DEMAND_ORDER_STATUS.rejected,
      stage: DEMAND_ORDER_STAGE.managerReview,
    })
    .eq("id", order.id)
    .eq("stage", DEMAND_ORDER_STAGE.managerReview)
    .in("status", [DEMAND_ORDER_STATUS.submitted, DEMAND_ORDER_STATUS.underReview])
    .select("id")
    .maybeSingle();

  if (updErr || !updated) {
    await supabase.from("approval_logs").delete().eq("id", logRow.id);
    return {
      ok: false,
      error: toSafeActionError(
        updErr,
        "Order could not be rejected (it may have changed).",
        "demandOrders.approval.reject.updateOrder"
      ),
    };
  }

  revalidatePath(ROUTES.approvals);
  revalidatePath(ROUTES.accountsReview);
  revalidatePath(ROUTES.demandOrders);
  revalidatePath(`${ROUTES.demandOrders}/${order.id}`);
  return { ok: true };
}

export async function forwardDemandOrderAction(input: ForwardDemandOrderInput): Promise<ActionResult> {
  const parsed = forwardDemandOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canReviewDemandOrders(role)) {
    return { ok: false, error: "You do not have permission to forward demand orders." };
  }
  if (!profile?.organization_id || !profile.id) {
    return { ok: false, error: "Your profile must belong to an organization." };
  }

  const { data: order } = await supabase
    .from("demand_orders")
    .select("id, organization_id, created_by_user_id, status, stage")
    .eq("id", parsed.data.demandOrderId)
    .maybeSingle();

  if (!order || order.organization_id !== profile.organization_id) {
    return { ok: false, error: "Demand order not found in your organization." };
  }
  if (order.created_by_user_id === profile.id) {
    return { ok: false, error: "You cannot forward your own order." };
  }
  if (order.stage !== DEMAND_ORDER_STAGE.managerReview) {
    return { ok: false, error: "This order is not in manager review." };
  }
  if (order.status !== DEMAND_ORDER_STATUS.submitted) {
    return { ok: false, error: "Only submitted orders can be forwarded for deeper review." };
  }

  const allowed = await canActorReviewDemandOrder(
    supabase,
    profile.id,
    order.created_by_user_id,
    role
  );
  if (!allowed) {
    return { ok: false, error: "You are outside the allowed review scope for this order." };
  }

  if (parsed.data.to_user_id === order.created_by_user_id) {
    return { ok: false, error: "You cannot forward an order to its owner." };
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("id, organization_id, role_id")
    .eq("id", parsed.data.to_user_id)
    .maybeSingle();

  if (!targetProfile || targetProfile.organization_id !== profile.organization_id) {
    return { ok: false, error: "Forward target must belong to your organization." };
  }

  const { data: targetRole } = await supabase
    .from("roles")
    .select("slug")
    .eq("id", targetProfile.role_id)
    .maybeSingle();

  const targetRoleSlug = targetRole?.slug ?? null;
  const targetAppRole = targetRoleSlug && isAppRole(targetRoleSlug) ? targetRoleSlug : null;
  if (!targetAppRole || !canReviewDemandOrders(targetAppRole)) {
    return { ok: false, error: "Forward target must be a reviewer role in your organization." };
  }

  const targetCanReview = await canActorReviewDemandOrder(
    supabase,
    parsed.data.to_user_id,
    order.created_by_user_id,
    targetAppRole
  );
  if (!targetCanReview) {
    return {
      ok: false,
      error: "Forward target is not in scope to review this order (hierarchy or role).",
    };
  }

  const note = (parsed.data.note ?? "").trim();

  const { data: logRow, error: logErr } = await supabase
    .from("approval_logs")
    .insert({
      organization_id: profile.organization_id,
      entity_type: "demand_order",
      entity_id: order.id,
      action: APPROVAL_LOG_ACTION.forward,
      from_user_id: profile.id,
      to_user_id: parsed.data.to_user_id,
      acted_by_user_id: profile.id,
      note,
    })
    .select("id")
    .single();

  if (logErr || !logRow) {
    return {
      ok: false,
      error: toSafeActionError(logErr, "Could not record forward.", "demandOrders.approval.forward.insertLog"),
    };
  }

  const { data: updated, error: updErr } = await supabase
    .from("demand_orders")
    .update({
      status: DEMAND_ORDER_STATUS.underReview,
      stage: DEMAND_ORDER_STAGE.managerReview,
    })
    .eq("id", order.id)
    .eq("stage", DEMAND_ORDER_STAGE.managerReview)
    .eq("status", DEMAND_ORDER_STATUS.submitted)
    .select("id")
    .maybeSingle();

  if (updErr || !updated) {
    await supabase.from("approval_logs").delete().eq("id", logRow.id);
    return {
      ok: false,
      error: toSafeActionError(
        updErr,
        "Order could not be forwarded (it may have changed).",
        "demandOrders.approval.forward.updateOrder"
      ),
    };
  }

  revalidatePath(ROUTES.approvals);
  revalidatePath(ROUTES.accountsReview);
  revalidatePath(ROUTES.demandOrders);
  revalidatePath(`${ROUTES.demandOrders}/${order.id}`);
  return { ok: true };
}
