"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
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
import type { AppRole } from "@/constants/roles";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

function canOrgScopeReview(role: AppRole | null): boolean {
  return role === "hos" || isOrgAdminRole(role);
}

async function canReviewActorAccessOwner(
  ownerUserId: string,
  role: AppRole | null
): Promise<boolean> {
  const supabase = await createClient();
  const { profile } = await requireUserProfile();
  if (!profile?.id || !profile.organization_id) return false;
  if (canOrgScopeReview(role)) return true;
  if (role !== "manager" && role !== "assistant_manager") return false;

  const { data, error } = await supabase.rpc("can_access_profile", {
    p_actor_profile_id: profile.id,
    p_target_profile_id: ownerUserId,
    p_has_org_wide_access: false,
    p_max_depth: 25,
  });
  if (error) return false;
  const row = Array.isArray(data) ? data[0] : data;
  return Boolean(row && typeof row === "object" && "can_access" in row && row.can_access);
}

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
    return { ok: false, error: error?.message ?? "Could not create work plan." };
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

  const { error } = await supabase
    .from("work_plans")
    .update({
      plan_date: parsed.data.plan_date,
      title: parsed.data.title.trim(),
      details: parsed.data.details.trim(),
      priority: parsed.data.priority ?? null,
    })
    .eq("id", parsed.data.workPlanId);

  if (error) return { ok: false, error: error.message };

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

  const { error } = await supabase
    .from("work_plans")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      review_note: null,
      reviewed_by: null,
      reviewed_at: null,
    })
    .eq("id", parsed.data.workPlanId);

  if (error) return { ok: false, error: error.message };

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

  const allowed = await canReviewActorAccessOwner(target.owner_user_id, role);
  if (!allowed) {
    return { ok: false, error: "You are outside the allowed review scope." };
  }

  const { error } = await supabase
    .from("work_plans")
    .update({
      status: parsed.data.status,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      review_note: parsed.data.review_note?.trim() || null,
    })
    .eq("id", parsed.data.workPlanId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(ROUTES.workPlans);
  revalidatePath(`${ROUTES.workPlans}/${parsed.data.workPlanId}`);
  return { ok: true };
}
