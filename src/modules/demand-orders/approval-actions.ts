"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
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
  if (order.stage !== "manager_review") {
    return { ok: false, error: "This order is not in manager review." };
  }
  if (order.status !== "submitted" && order.status !== "under_review") {
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
      action: "approve",
      from_user_id: null,
      to_user_id: null,
      acted_by_user_id: profile.id,
      note,
    })
    .select("id")
    .single();

  if (logErr || !logRow) {
    return { ok: false, error: logErr?.message ?? "Could not record approval." };
  }

  const { data: updated, error: updErr } = await supabase
    .from("demand_orders")
    .update({ status: "approved", stage: "accounts_review" })
    .eq("id", order.id)
    .eq("stage", "manager_review")
    .in("status", ["submitted", "under_review"])
    .select("id")
    .maybeSingle();

  if (updErr || !updated) {
    await supabase.from("approval_logs").delete().eq("id", logRow.id);
    return {
      ok: false,
      error: updErr?.message ?? "Order could not be approved (it may have changed).",
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
  if (order.stage !== "manager_review") {
    return { ok: false, error: "This order is not in manager review." };
  }
  if (order.status !== "submitted" && order.status !== "under_review") {
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
      action: "reject",
      from_user_id: null,
      to_user_id: null,
      acted_by_user_id: profile.id,
      note,
    })
    .select("id")
    .single();

  if (logErr || !logRow) {
    return { ok: false, error: logErr?.message ?? "Could not record rejection." };
  }

  const { data: updated, error: updErr } = await supabase
    .from("demand_orders")
    .update({ status: "rejected", stage: "manager_review" })
    .eq("id", order.id)
    .eq("stage", "manager_review")
    .in("status", ["submitted", "under_review"])
    .select("id")
    .maybeSingle();

  if (updErr || !updated) {
    await supabase.from("approval_logs").delete().eq("id", logRow.id);
    return {
      ok: false,
      error: updErr?.message ?? "Order could not be rejected (it may have changed).",
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
  if (order.stage !== "manager_review") {
    return { ok: false, error: "This order is not in manager review." };
  }
  if (order.status !== "submitted") {
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
  if (
    !targetRoleSlug ||
    !["manager", "assistant_manager", "hos", "admin"].includes(targetRoleSlug)
  ) {
    return { ok: false, error: "Forward target must be a reviewer role in your organization." };
  }

  const note = (parsed.data.note ?? "").trim();

  const { data: logRow, error: logErr } = await supabase
    .from("approval_logs")
    .insert({
      organization_id: profile.organization_id,
      entity_type: "demand_order",
      entity_id: order.id,
      action: "forward",
      from_user_id: profile.id,
      to_user_id: parsed.data.to_user_id,
      acted_by_user_id: profile.id,
      note,
    })
    .select("id")
    .single();

  if (logErr || !logRow) {
    return { ok: false, error: logErr?.message ?? "Could not record forward." };
  }

  const { data: updated, error: updErr } = await supabase
    .from("demand_orders")
    .update({ status: "under_review", stage: "manager_review" })
    .eq("id", order.id)
    .eq("stage", "manager_review")
    .eq("status", "submitted")
    .select("id")
    .maybeSingle();

  if (updErr || !updated) {
    await supabase.from("approval_logs").delete().eq("id", logRow.id);
    return {
      ok: false,
      error: updErr?.message ?? "Order could not be forwarded (it may have changed).",
    };
  }

  revalidatePath(ROUTES.approvals);
  revalidatePath(ROUTES.accountsReview);
  revalidatePath(ROUTES.demandOrders);
  revalidatePath(`${ROUTES.demandOrders}/${order.id}`);
  return { ok: true };
}
