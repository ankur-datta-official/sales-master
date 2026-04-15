"use server";

import { revalidatePath } from "next/cache";

import type { AppRole } from "@/constants/roles";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { toSafeActionError } from "@/lib/errors/safe-action-error";
import { createClient } from "@/lib/supabase/server";
import {
  canCreateWorkReports,
  canReviewWorkReports,
  isOrgAdminRole,
} from "@/lib/users/actor-permissions";
import {
  createWorkReportSchema,
  reviewWorkReportSchema,
  submitWorkReportSchema,
  updateDraftWorkReportSchema,
  type CreateWorkReportInput,
  type ReviewWorkReportInput,
  type SubmitWorkReportInput,
  type UpdateDraftWorkReportInput,
} from "@/modules/work-reports/schemas";

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

export async function createWorkReportAction(
  input: CreateWorkReportInput
): Promise<ActionResult<{ workReportId: string }>> {
  const parsed = createWorkReportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canCreateWorkReports(role)) {
    return { ok: false, error: "You do not have permission to create work reports." };
  }
  if (
    !profile?.organization_id ||
    parsed.data.organization_id !== profile.organization_id
  ) {
    return { ok: false, error: "Invalid organization." };
  }

  const { data, error } = await supabase
    .from("work_reports")
    .insert({
      organization_id: profile.organization_id,
      owner_user_id: profile.id,
      report_date: parsed.data.report_date,
      summary: parsed.data.summary.trim(),
      achievements: parsed.data.achievements?.trim() || null,
      challenges: parsed.data.challenges?.trim() || null,
      next_step: parsed.data.next_step?.trim() || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: toSafeActionError(error, "Could not create work report.", "workReports.createWorkReportAction"),
    };
  }

  revalidatePath(ROUTES.workReports);
  revalidatePath(`${ROUTES.workReports}/${data.id}`);
  return { ok: true, data: { workReportId: data.id } };
}

export async function updateDraftWorkReportAction(
  input: UpdateDraftWorkReportInput
): Promise<ActionResult> {
  const parsed = updateDraftWorkReportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  const isAdmin = isOrgAdminRole(role);

  const { data: target } = await supabase
    .from("work_reports")
    .select("id, owner_user_id, status, organization_id")
    .eq("id", parsed.data.workReportId)
    .maybeSingle();

  if (!target || !profile?.organization_id || target.organization_id !== profile.organization_id) {
    return { ok: false, error: "Work report not found in your organization." };
  }
  if (!isAdmin && target.owner_user_id !== profile.id) {
    return { ok: false, error: "You can edit only your own draft reports." };
  }
  if (target.status !== "draft") {
    return { ok: false, error: "Only draft reports can be edited." };
  }

  const { error } = await supabase
    .from("work_reports")
    .update({
      report_date: parsed.data.report_date,
      summary: parsed.data.summary.trim(),
      achievements: parsed.data.achievements?.trim() || null,
      challenges: parsed.data.challenges?.trim() || null,
      next_step: parsed.data.next_step?.trim() || null,
    })
    .eq("id", parsed.data.workReportId);

  if (error) {
    return {
      ok: false,
      error: toSafeActionError(error, "Could not update work report.", "workReports.updateDraftWorkReportAction"),
    };
  }

  revalidatePath(ROUTES.workReports);
  revalidatePath(`${ROUTES.workReports}/${parsed.data.workReportId}`);
  return { ok: true };
}

export async function submitWorkReportAction(
  input: SubmitWorkReportInput
): Promise<ActionResult> {
  const parsed = submitWorkReportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  const isAdmin = isOrgAdminRole(role);

  const { data: target } = await supabase
    .from("work_reports")
    .select("id, owner_user_id, status, organization_id")
    .eq("id", parsed.data.workReportId)
    .maybeSingle();

  if (!target || !profile?.organization_id || target.organization_id !== profile.organization_id) {
    return { ok: false, error: "Work report not found in your organization." };
  }
  if (!isAdmin && target.owner_user_id !== profile.id) {
    return { ok: false, error: "You can submit only your own reports." };
  }
  if (target.status !== "draft") {
    return { ok: false, error: "Only draft reports can be submitted." };
  }

  const { error } = await supabase
    .from("work_reports")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      review_note: null,
      reviewed_by: null,
      reviewed_at: null,
    })
    .eq("id", parsed.data.workReportId);

  if (error) {
    return {
      ok: false,
      error: toSafeActionError(error, "Could not submit work report.", "workReports.submitWorkReportAction"),
    };
  }

  revalidatePath(ROUTES.workReports);
  revalidatePath(`${ROUTES.workReports}/${parsed.data.workReportId}`);
  return { ok: true };
}

export async function reviewWorkReportAction(
  input: ReviewWorkReportInput
): Promise<ActionResult> {
  const parsed = reviewWorkReportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);
  if (!canReviewWorkReports(role)) {
    return { ok: false, error: "You do not have review permission." };
  }
  if (!profile?.organization_id) {
    return { ok: false, error: "Your profile is missing an organization." };
  }

  const { data: target } = await supabase
    .from("work_reports")
    .select("id, owner_user_id, status, organization_id")
    .eq("id", parsed.data.workReportId)
    .maybeSingle();
  if (!target || target.organization_id !== profile.organization_id) {
    return { ok: false, error: "Work report not found in your organization." };
  }
  if (target.status !== "submitted") {
    return { ok: false, error: "Only submitted reports can be reviewed." };
  }
  if (target.owner_user_id === profile.id) {
    return { ok: false, error: "You cannot review your own report." };
  }

  const allowed = await canReviewActorAccessOwner(target.owner_user_id, role);
  if (!allowed) {
    return { ok: false, error: "You are outside the allowed review scope." };
  }

  const { error } = await supabase
    .from("work_reports")
    .update({
      status: parsed.data.status,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      review_note: parsed.data.review_note?.trim() || null,
    })
    .eq("id", parsed.data.workReportId);

  if (error) {
    return {
      ok: false,
      error: toSafeActionError(error, "Could not review work report.", "workReports.reviewWorkReportAction"),
    };
  }

  revalidatePath(ROUTES.workReports);
  revalidatePath(`${ROUTES.workReports}/${parsed.data.workReportId}`);
  return { ok: true };
}
