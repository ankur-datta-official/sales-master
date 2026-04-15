"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canCreateVisitPlans, isOrgAdminRole } from "@/lib/users/actor-permissions";
import {
  createVisitPlanSchema,
  updatePlannedVisitPlanSchema,
  updateVisitPlanStatusSchema,
  type CreateVisitPlanInput,
  type UpdatePlannedVisitPlanInput,
  type UpdateVisitPlanStatusInput,
} from "@/modules/visit-plans/schemas";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function createVisitPlanAction(
  input: CreateVisitPlanInput
): Promise<ActionResult<{ visitPlanId: string }>> {
  const parsed = createVisitPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canCreateVisitPlans(role)) {
    return { ok: false, error: "You do not have permission to create visit plans." };
  }
  if (
    !profile?.organization_id ||
    parsed.data.organization_id !== profile.organization_id
  ) {
    return { ok: false, error: "Invalid organization." };
  }

  const isAdmin = isOrgAdminRole(role);
  let assigneeId = profile.id;
  if (isAdmin) {
    if (!parsed.data.assignee_user_id) {
      return { ok: false, error: "Assignee is required." };
    }
    assigneeId = parsed.data.assignee_user_id;
    const { data: assigneeRow } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", assigneeId)
      .maybeSingle();
    if (!assigneeRow || assigneeRow.organization_id !== profile.organization_id) {
      return { ok: false, error: "Assignee must be a user in your organization." };
    }
  }

  const { data: partyRow } = await supabase
    .from("parties")
    .select("id, organization_id")
    .eq("id", parsed.data.party_id)
    .maybeSingle();
  if (!partyRow || partyRow.organization_id !== profile.organization_id) {
    return { ok: false, error: "Party not found in your organization." };
  }

  const { data, error } = await supabase
    .from("visit_plans")
    .insert({
      organization_id: profile.organization_id,
      party_id: parsed.data.party_id,
      user_id: assigneeId,
      visit_date: parsed.data.visit_date,
      purpose: parsed.data.purpose.trim(),
      status: "planned",
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create visit plan." };
  }

  revalidatePath(ROUTES.visitPlans);
  revalidatePath(`${ROUTES.visitPlans}/${data.id}`);
  return { ok: true, data: { visitPlanId: data.id } };
}

export async function updatePlannedVisitPlanAction(
  input: UpdatePlannedVisitPlanInput
): Promise<ActionResult> {
  const parsed = updatePlannedVisitPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { profile } = await requireUserProfile();

  const { data: target } = await supabase
    .from("visit_plans")
    .select("id, user_id, status, organization_id")
    .eq("id", parsed.data.visitPlanId)
    .maybeSingle();

  if (!target || !profile?.organization_id || target.organization_id !== profile.organization_id) {
    return { ok: false, error: "Visit plan not found in your organization." };
  }
  if (target.user_id !== profile.id) {
    return { ok: false, error: "You can edit only your own planned visits." };
  }
  if (target.status !== "planned") {
    return { ok: false, error: "Only planned visits can be edited." };
  }

  const { data: partyRow } = await supabase
    .from("parties")
    .select("id, organization_id")
    .eq("id", parsed.data.party_id)
    .maybeSingle();
  if (!partyRow || partyRow.organization_id !== profile.organization_id) {
    return { ok: false, error: "Party not found in your organization." };
  }

  const { error } = await supabase
    .from("visit_plans")
    .update({
      party_id: parsed.data.party_id,
      visit_date: parsed.data.visit_date,
      purpose: parsed.data.purpose.trim(),
    })
    .eq("id", parsed.data.visitPlanId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(ROUTES.visitPlans);
  revalidatePath(`${ROUTES.visitPlans}/${parsed.data.visitPlanId}`);
  return { ok: true };
}

export async function updateVisitPlanStatusAction(
  input: UpdateVisitPlanStatusInput
): Promise<ActionResult> {
  const parsed = updateVisitPlanStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { profile } = await requireUserProfile();

  const { data: target } = await supabase
    .from("visit_plans")
    .select("id, user_id, status, organization_id")
    .eq("id", parsed.data.visitPlanId)
    .maybeSingle();

  if (!target || !profile?.organization_id || target.organization_id !== profile.organization_id) {
    return { ok: false, error: "Visit plan not found in your organization." };
  }
  if (target.user_id !== profile.id) {
    return { ok: false, error: "You can update status only on your own visits." };
  }
  if (target.status !== "planned") {
    return { ok: false, error: "Status can be updated only for planned visits." };
  }

  const { error } = await supabase
    .from("visit_plans")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.visitPlanId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(ROUTES.visitPlans);
  revalidatePath(`${ROUTES.visitPlans}/${parsed.data.visitPlanId}`);
  return { ok: true };
}
