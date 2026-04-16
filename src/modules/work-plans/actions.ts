"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { canReviewOwnerByHierarchy } from "@/lib/auth/can-review-owner";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { toSafeActionError } from "@/lib/errors/safe-action-error";
import { createClient } from "@/lib/supabase/server";
import {
  canCreateWorkPlans,
  canReviewWorkPlans,
  isOrgAdminRole,
} from "@/lib/users/actor-permissions";
import {
  createWorkPlanSchema,
  reviewWorkPlanSchema,
  submitWorkPlanSchema,
  updateDraftWorkPlanSchema,
  type CreateWorkPlanInput,
  type ReviewWorkPlanInput,
  type SubmitWorkPlanInput,
  type UpdateDraftWorkPlanInput,
} from "@/modules/work-plans/schemas";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function createWorkPlanAction(
  input: CreateWorkPlanInput
): Promise<ActionResult<{ workPlanId: string }>> {
  const parsed = createWorkPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canCreateWorkPlans(role)) {
    return { ok: false, error: "You do not have permission to create work plans." };
  }
  if (
    !profile?.organization_id ||
    parsed.data.organization_id !== profile.organization_id
  ) {
    return { ok: false, error: "Invalid organization." };
  }

  const { data, error } = await supabase
    .from("work_plans")
    .insert({
      organization_id: profile.organization_id,
      owner_user_id: profile.id,
      plan_date: parsed.data.plan_date,
      title: parsed.data.title.trim(),
      details: parsed.data.details.trim(),
      priority: parsed.data.priority ?? null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: toSafeActionError(error, "Could not create work plan.", "workPlans.createWorkPlanAction"),
    };
  }

  revalidatePath(ROUTES.workPlans);
  revalidatePath(`${ROUTES.workPlans}/${data.id}`);
  return { ok: true, data: { workPlanId: data.id } };
}

export async function updateDraftWorkPlanAction(
  input: UpdateDraftWorkPlanInput
): Promise<ActionResult> {
  const parsed = updateDraftWorkPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  const isAdmin = isOrgAdminRole(role);

  const { data: target } = await supabase
    .from("work_plans")
    .select("id, owner_user_id, status, organization_id")
    .eq("id", parsed.data.workPlanId)
    .maybeSingle();

  if (!target || !profile?.organization_id || target.organization_id !== profile.organization_id) {
    return { ok: false, error: "Work plan not found in your organization." };
  }
  if (!isAdmin && target.owner_user_id !== profile.id) {
    return { ok: false, error: "You can edit only your own draft plans." };
  }
  if (target.status !== "draft") {
    return { ok: false, error: "Only draft plans can be edited." };
  }

  const { data: updatedRow, error } = await supabase
    .from("work_plans")
    .update({
      plan_date: parsed.data.plan_date,
      title: parsed.data.title.trim(),
      details: parsed.data.details.trim(),
      priority: parsed.data.priority ?? null,
    })
    .eq("id", parsed.data.workPlanId)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: toSafeActionError(error, "Could not update work plan.", "workPlans.updateDraftWorkPlanAction"),
    };
  }
  if (!updatedRow) {
    return {
      ok: false,
      error: "This plan is no longer a draft or could not be updated. Refresh and try again.",
    };
  }

  revalidatePath(ROUTES.workPlans);
  revalidatePath(`${ROUTES.workPlans}/${parsed.data.workPlanId}`);
  return { ok: true };
}

export async function submitWorkPlanAction(
  input: SubmitWorkPlanInput
): Promise<ActionResult> {
  const parsed = submitWorkPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  const isAdmin = isOrgAdminRole(role);

  const { data: target } = await supabase
    .from("work_plans")
    .select("id, owner_user_id, status, organization_id")
    .eq("id", parsed.data.workPlanId)
    .maybeSingle();

  if (!target || !profile?.organization_id || target.organization_id !== profile.organization_id) {
    return { ok: false, error: "Work plan not found in your organization." };
  }
  if (!isAdmin && target.owner_user_id !== profile.id) {
    return { ok: false, error: "You can submit only your own plans." };
  }
  if (target.status !== "draft") {
    return { ok: false, error: "Only draft plans can be submitted." };
  }

  const { data: submittedRow, error } = await supabase
    .from("work_plans")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      review_note: null,
      reviewed_by: null,
      reviewed_at: null,
    })
    .eq("id", parsed.data.workPlanId)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: toSafeActionError(error, "Could not submit work plan.", "workPlans.submitWorkPlanAction"),
    };
  }
  if (!submittedRow) {
    return {
      ok: false,
      error: "Only draft plans can be submitted, or the plan was changed elsewhere. Refresh and try again.",
    };
  }

  revalidatePath(ROUTES.workPlans);
  revalidatePath(`${ROUTES.workPlans}/${parsed.data.workPlanId}`);
  return { ok: true };
}

export async function reviewWorkPlanAction(
  input: ReviewWorkPlanInput
): Promise<ActionResult> {
  const parsed = reviewWorkPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  if (!canReviewWorkPlans(role)) {
    return { ok: false, error: "You do not have review permission." };
  }
  if (!profile?.organization_id) {
    return { ok: false, error: "Your profile is missing an organization." };
  }

  const { data: target } = await supabase
    .from("work_plans")
    .select("id, owner_user_id, status, organization_id")
    .eq("id", parsed.data.workPlanId)
    .maybeSingle();
  if (!target || target.organization_id !== profile.organization_id) {
    return { ok: false, error: "Work plan not found in your organization." };
  }
  if (target.status !== "submitted") {
    return { ok: false, error: "Only submitted plans can be reviewed." };
  }
  if (target.owner_user_id === profile.id) {
    return { ok: false, error: "You cannot review your own plan." };
  }

  const allowed = await canReviewOwnerByHierarchy(
    supabase,
    profile.id,
    target.owner_user_id,
    role
  );
  if (!allowed) {
    return { ok: false, error: "You are outside the allowed review scope." };
  }

  const { data: reviewedRow, error } = await supabase
    .from("work_plans")
    .update({
      status: parsed.data.status,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      review_note: parsed.data.review_note?.trim() || null,
    })
    .eq("id", parsed.data.workPlanId)
    .eq("status", "submitted")
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: toSafeActionError(error, "Could not review work plan.", "workPlans.reviewWorkPlanAction"),
    };
  }
  if (!reviewedRow) {
    return {
      ok: false,
      error: "Only submitted plans can be reviewed, or the plan changed. Refresh and try again.",
    };
  }

  revalidatePath(ROUTES.workPlans);
  revalidatePath(`${ROUTES.workPlans}/${parsed.data.workPlanId}`);
  return { ok: true };
}
