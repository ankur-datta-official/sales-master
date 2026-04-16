"use server";

import { revalidatePath } from "next/cache";

import { APPROVAL_LOG_ACTION, DEMAND_ORDER_STAGE, DEMAND_ORDER_STATUS } from "@/constants/statuses";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { toSafeActionError } from "@/lib/errors/safe-action-error";
import { createClient } from "@/lib/supabase/server";
import { canPerformAccountsDemandOrderReview } from "@/lib/users/actor-permissions";
import {
  accountsApproveDemandOrderSchema,
  accountsRejectDemandOrderSchema,
  type AccountsApproveDemandOrderInput,
  type AccountsRejectDemandOrderInput,
} from "@/modules/demand-orders/accounts-schemas";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function accountsApproveDemandOrderAction(
  input: AccountsApproveDemandOrderInput
): Promise<ActionResult> {
  const parsed = accountsApproveDemandOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canPerformAccountsDemandOrderReview(role)) {
    return { ok: false, error: "You do not have permission to perform accounts approval." };
  }
  if (!profile?.organization_id || !profile.id) {
    return { ok: false, error: "Your profile must belong to an organization." };
  }

  const { data: order } = await supabase
    .from("demand_orders")
    .select("id, organization_id, stage, status")
    .eq("id", parsed.data.demandOrderId)
    .maybeSingle();

  if (!order || order.organization_id !== profile.organization_id) {
    return { ok: false, error: "Demand order not found in your organization." };
  }
  if (
    order.stage !== DEMAND_ORDER_STAGE.accountsReview ||
    order.status !== DEMAND_ORDER_STATUS.approved
  ) {
    return {
      ok: false,
      error: "Only manager-approved orders in accounts review can be released to factory.",
    };
  }

  const note = (parsed.data.note ?? "").trim();

  const { data: logRow, error: logErr } = await supabase
    .from("approval_logs")
    .insert({
      organization_id: profile.organization_id,
      entity_type: "demand_order",
      entity_id: order.id,
      action: APPROVAL_LOG_ACTION.accountsApprove,
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
      error: toSafeActionError(
        logErr,
        "Could not record accounts approval.",
        "demandOrders.accounts.approve.insertLog"
      ),
    };
  }

  const { data: updated, error: updErr } = await supabase
    .from("demand_orders")
    .update({
      status: DEMAND_ORDER_STATUS.sentToFactory,
      stage: DEMAND_ORDER_STAGE.factoryQueue,
    })
    .eq("id", order.id)
    .eq("stage", DEMAND_ORDER_STAGE.accountsReview)
    .eq("status", DEMAND_ORDER_STATUS.approved)
    .select("id")
    .maybeSingle();

  if (updErr || !updated) {
    await supabase.from("approval_logs").delete().eq("id", logRow.id);
    return {
      ok: false,
      error: toSafeActionError(
        updErr,
        "Order could not be updated (it may have changed).",
        "demandOrders.accounts.approve.updateOrder"
      ),
    };
  }

  revalidatePath(ROUTES.accountsReview);
  revalidatePath(ROUTES.approvals);
  revalidatePath(ROUTES.demandOrders);
  revalidatePath(`${ROUTES.demandOrders}/${order.id}`);
  return { ok: true };
}

export async function accountsRejectDemandOrderAction(
  input: AccountsRejectDemandOrderInput
): Promise<ActionResult> {
  const parsed = accountsRejectDemandOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canPerformAccountsDemandOrderReview(role)) {
    return { ok: false, error: "You do not have permission to perform accounts rejection." };
  }
  if (!profile?.organization_id || !profile.id) {
    return { ok: false, error: "Your profile must belong to an organization." };
  }

  const { data: order } = await supabase
    .from("demand_orders")
    .select("id, organization_id, stage, status")
    .eq("id", parsed.data.demandOrderId)
    .maybeSingle();

  if (!order || order.organization_id !== profile.organization_id) {
    return { ok: false, error: "Demand order not found in your organization." };
  }
  if (
    order.stage !== DEMAND_ORDER_STAGE.accountsReview ||
    order.status !== DEMAND_ORDER_STATUS.approved
  ) {
    return {
      ok: false,
      error: "Only orders in accounts review can be rejected by accounts.",
    };
  }

  const note = (parsed.data.note ?? "").trim();

  const { data: logRow, error: logErr } = await supabase
    .from("approval_logs")
    .insert({
      organization_id: profile.organization_id,
      entity_type: "demand_order",
      entity_id: order.id,
      action: APPROVAL_LOG_ACTION.accountsReject,
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
      error: toSafeActionError(
        logErr,
        "Could not record accounts rejection.",
        "demandOrders.accounts.reject.insertLog"
      ),
    };
  }

  const { data: updated, error: updErr } = await supabase
    .from("demand_orders")
    .update({
      status: DEMAND_ORDER_STATUS.rejected,
      stage: DEMAND_ORDER_STAGE.managerReview,
    })
    .eq("id", order.id)
    .eq("stage", DEMAND_ORDER_STAGE.accountsReview)
    .eq("status", DEMAND_ORDER_STATUS.approved)
    .select("id")
    .maybeSingle();

  if (updErr || !updated) {
    await supabase.from("approval_logs").delete().eq("id", logRow.id);
    return {
      ok: false,
      error: toSafeActionError(
        updErr,
        "Order could not be rejected (it may have changed).",
        "demandOrders.accounts.reject.updateOrder"
      ),
    };
  }

  revalidatePath(ROUTES.accountsReview);
  revalidatePath(ROUTES.approvals);
  revalidatePath(ROUTES.demandOrders);
  revalidatePath(`${ROUTES.demandOrders}/${order.id}`);
  return { ok: true };
}
