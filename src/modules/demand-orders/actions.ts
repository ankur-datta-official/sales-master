"use server";

import { revalidatePath } from "next/cache";

import { APPROVAL_LOG_ACTION, DEMAND_ORDER_STAGE, DEMAND_ORDER_STATUS } from "@/constants/statuses";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { toSafeActionError } from "@/lib/errors/safe-action-error";
import { createClient } from "@/lib/supabase/server";
import { canCreateDemandOrders, isOrgAdminRole } from "@/lib/users/actor-permissions";
import {
  createDemandOrderSchema,
  submitDemandOrderSchema,
  updateDraftDemandOrderSchema,
  type CreateDemandOrderInput,
  type DemandOrderLineInput,
  type SubmitDemandOrderInput,
  type UpdateDraftDemandOrderInput,
} from "@/modules/demand-orders/schemas";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

function linesToJsonForRpc(items: DemandOrderLineInput[]) {
  return items.map((i) => ({
    product_id: i.product_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
    remark: (i.remark ?? "").trim(),
  }));
}

async function assertPartyInOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  partyId: string,
  organizationId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("parties")
    .select("id")
    .eq("id", partyId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!data) return "Party not found in your organization.";
  return null;
}

export async function createDemandOrderAction(
  input: CreateDemandOrderInput
): Promise<ActionResult<{ demandOrderId: string }>> {
  const parsed = createDemandOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canCreateDemandOrders(role)) {
    return { ok: false, error: "You do not have permission to create demand orders." };
  }
  if (
    !profile?.organization_id ||
    parsed.data.organization_id !== profile.organization_id
  ) {
    return { ok: false, error: "Invalid organization." };
  }

  const isAdmin = isOrgAdminRole(role);
  let ownerId = profile.id;
  if (isAdmin) {
    if (!parsed.data.assignee_user_id) {
      return { ok: false, error: "User is required." };
    }
    ownerId = parsed.data.assignee_user_id;
    const { data: assigneeRow } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", ownerId)
      .maybeSingle();
    if (!assigneeRow || assigneeRow.organization_id !== profile.organization_id) {
      return { ok: false, error: "User must belong to your organization." };
    }
  }

  const partyErr = await assertPartyInOrg(supabase, parsed.data.party_id, profile.organization_id);
  if (partyErr) return { ok: false, error: partyErr };

  const remarks = (parsed.data.remarks ?? "").trim();

  const { data: orderRow, error: orderErr } = await supabase
    .from("demand_orders")
    .insert({
      organization_id: profile.organization_id,
      party_id: parsed.data.party_id,
      created_by_user_id: ownerId,
      order_date: parsed.data.order_date,
      remarks,
      status: DEMAND_ORDER_STATUS.draft,
    })
    .select("id")
    .single();

  if (orderErr || !orderRow) {
    return {
      ok: false,
      error: toSafeActionError(orderErr, "Could not create demand order.", "demandOrders.createDemandOrderAction.insertOrder"),
    };
  }

  const { error: rpcErr } = await supabase.rpc("replace_demand_order_items", {
    p_order_id: orderRow.id,
    p_items: linesToJsonForRpc(parsed.data.items),
  });

  if (rpcErr) {
    await supabase.from("demand_orders").delete().eq("id", orderRow.id);
    return {
      ok: false,
      error: toSafeActionError(
        rpcErr,
        "Could not save demand order items.",
        "demandOrders.createDemandOrderAction.replaceItems"
      ),
    };
  }

  revalidatePath(ROUTES.demandOrders);
  revalidatePath(`${ROUTES.demandOrders}/${orderRow.id}`);
  return { ok: true, data: { demandOrderId: orderRow.id } };
}

export async function updateDraftDemandOrderAction(
  input: UpdateDraftDemandOrderInput
): Promise<ActionResult> {
  const parsed = updateDraftDemandOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  const isAdmin = isOrgAdminRole(role);

  if (!profile?.organization_id) {
    return { ok: false, error: "Your profile must belong to an organization." };
  }

  const { data: target } = await supabase
    .from("demand_orders")
    .select("id, organization_id, created_by_user_id, status, stage, party_id, order_date, remarks")
    .eq("id", parsed.data.demandOrderId)
    .maybeSingle();

  if (!target || target.organization_id !== profile.organization_id) {
    return { ok: false, error: "Demand order not found in your organization." };
  }
  if (target.status !== DEMAND_ORDER_STATUS.draft || target.stage !== DEMAND_ORDER_STAGE.draft) {
    return { ok: false, error: "Only draft orders can be edited." };
  }
  if (!isAdmin && target.created_by_user_id !== profile.id) {
    return { ok: false, error: "You can edit only your own draft orders." };
  }

  const partyErr = await assertPartyInOrg(supabase, parsed.data.party_id, profile.organization_id);
  if (partyErr) return { ok: false, error: partyErr };

  const remarks = (parsed.data.remarks ?? "").trim();

  const { data: headerUpdated, error: headerErr } = await supabase
    .from("demand_orders")
    .update({
      party_id: parsed.data.party_id,
      order_date: parsed.data.order_date,
      remarks,
    })
    .eq("id", parsed.data.demandOrderId)
    .eq("status", DEMAND_ORDER_STATUS.draft)
    .eq("stage", DEMAND_ORDER_STAGE.draft)
    .select("id")
    .maybeSingle();

  if (headerErr) {
    return {
      ok: false,
      error: toSafeActionError(
        headerErr,
        "Could not update demand order header.",
        "demandOrders.updateDraftDemandOrderAction.updateHeader"
      ),
    };
  }
  if (!headerUpdated) {
    return {
      ok: false,
      error: "This order is no longer a draft or could not be updated. Refresh and try again.",
    };
  }

  const { error: rpcErr } = await supabase.rpc("replace_demand_order_items", {
    p_order_id: parsed.data.demandOrderId,
    p_items: linesToJsonForRpc(parsed.data.items),
  });

  if (rpcErr) {
    await supabase
      .from("demand_orders")
      .update({
        party_id: target.party_id,
        order_date: target.order_date,
        remarks: target.remarks ?? "",
      })
      .eq("id", parsed.data.demandOrderId)
      .eq("status", DEMAND_ORDER_STATUS.draft)
      .eq("stage", DEMAND_ORDER_STAGE.draft);
    return {
      ok: false,
      error: toSafeActionError(
        rpcErr,
        "Could not update demand order items.",
        "demandOrders.updateDraftDemandOrderAction.replaceItems"
      ),
    };
  }

  revalidatePath(ROUTES.demandOrders);
  revalidatePath(`${ROUTES.demandOrders}/${parsed.data.demandOrderId}`);
  return { ok: true };
}

export async function submitDemandOrderAction(
  input: SubmitDemandOrderInput
): Promise<ActionResult> {
  const parsed = submitDemandOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  const isAdmin = isOrgAdminRole(role);

  if (!profile?.organization_id) {
    return { ok: false, error: "Your profile must belong to an organization." };
  }

  const { data: target } = await supabase
    .from("demand_orders")
    .select("id, organization_id, created_by_user_id, status, stage")
    .eq("id", parsed.data.demandOrderId)
    .maybeSingle();

  if (!target || target.organization_id !== profile.organization_id) {
    return { ok: false, error: "Demand order not found in your organization." };
  }
  if (target.status !== DEMAND_ORDER_STATUS.draft || target.stage !== DEMAND_ORDER_STAGE.draft) {
    return { ok: false, error: "Only draft orders can be submitted." };
  }
  if (!isAdmin && target.created_by_user_id !== profile.id) {
    return { ok: false, error: "You can submit only your own orders." };
  }

  const { count, error: countErr } = await supabase
    .from("demand_order_items")
    .select("*", { count: "exact", head: true })
    .eq("demand_order_id", parsed.data.demandOrderId);

  if (countErr) {
    return {
      ok: false,
      error: toSafeActionError(
        countErr,
        "Could not validate demand order items.",
        "demandOrders.submitDemandOrderAction.countItems"
      ),
    };
  }
  if ((count ?? 0) < 1) {
    return { ok: false, error: "Add at least one line item before submitting." };
  }

  const { data: submittedRow, error: submitErr } = await supabase
    .from("demand_orders")
    .update({
      submitted_at: new Date().toISOString(),
      status: DEMAND_ORDER_STATUS.submitted,
      stage: DEMAND_ORDER_STAGE.managerReview,
    })
    .eq("id", parsed.data.demandOrderId)
    .eq("status", DEMAND_ORDER_STATUS.draft)
    .eq("stage", DEMAND_ORDER_STAGE.draft)
    .select("id")
    .maybeSingle();

  if (submitErr) {
    return {
      ok: false,
      error: toSafeActionError(
        submitErr,
        "Could not submit demand order.",
        "demandOrders.submitDemandOrderAction"
      ),
    };
  }
  if (!submittedRow) {
    return {
      ok: false,
      error: "This order is no longer a draft or was changed by another action. Refresh and try again.",
    };
  }

  const { error: logErr } = await supabase.from("approval_logs").insert({
    organization_id: profile.organization_id,
    entity_type: "demand_order",
    entity_id: parsed.data.demandOrderId,
    action: APPROVAL_LOG_ACTION.submit,
    from_user_id: null,
    to_user_id: null,
    acted_by_user_id: profile.id,
    note: "",
  });

  if (logErr) {
    await supabase
      .from("demand_orders")
      .update({
        status: DEMAND_ORDER_STATUS.draft,
        submitted_at: null,
        stage: DEMAND_ORDER_STAGE.draft,
      })
      .eq("id", parsed.data.demandOrderId)
      .eq("status", DEMAND_ORDER_STATUS.submitted)
      .eq("stage", DEMAND_ORDER_STAGE.managerReview);
    return {
      ok: false,
      error: toSafeActionError(logErr, "Could not write approval log.", "demandOrders.submitDemandOrderAction.insertApprovalLog"),
    };
  }

  revalidatePath(ROUTES.approvals);
  revalidatePath(ROUTES.accountsReview);
  revalidatePath(ROUTES.demandOrders);
  revalidatePath(`${ROUTES.demandOrders}/${parsed.data.demandOrderId}`);
  return { ok: true };
}
