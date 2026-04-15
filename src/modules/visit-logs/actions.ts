"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canCreateVisitLogs, isOrgAdminRole } from "@/lib/users/actor-permissions";
import {
  createVisitLogSchema,
  isVisitLogOwnerEditableWindow,
  updateVisitLogSchema,
  type CreateVisitLogInput,
  type UpdateVisitLogInput,
} from "@/modules/visit-logs/schemas";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

function normalizeOptionalUuid(value: string | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  return v;
}

function parseOptionalIsoTimestamptz(value: string | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  const ms = Date.parse(v);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

function parseOptionalCoord(value: string | undefined): number | null {
  const v = value?.trim();
  if (v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

function assertCheckOutAfterCheckIn(checkIn: string | null, checkOut: string | null): string | null {
  if (!checkIn || !checkOut) return null;
  if (new Date(checkOut) < new Date(checkIn)) {
    return "Check-out time must be on or after check-in time.";
  }
  return null;
}

function assertLatLng(lat: number | null, lng: number | null, label: string): string | null {
  if (lat === null && lng === null) return null;
  if (lat === null || lng === null) {
    return `${label}: provide both latitude and longitude or leave both empty.`;
  }
  if (lat < -90 || lat > 90) return `${label}: latitude must be between -90 and 90.`;
  if (lng < -180 || lng > 180) return `${label}: longitude must be between -180 and 180.`;
  return null;
}

async function assertVisitPlanLink(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  organizationId: string;
  visitPlanId: string;
  partyId: string;
  userId: string;
}): Promise<string | null> {
  const { supabase, organizationId, visitPlanId, partyId, userId } = args;
  const { data: plan } = await supabase
    .from("visit_plans")
    .select("id, organization_id, party_id, user_id")
    .eq("id", visitPlanId)
    .maybeSingle();
  if (!plan) return "Linked visit plan was not found.";
  if (plan.organization_id !== organizationId) return "Visit plan is not in your organization.";
  if (plan.party_id !== partyId) return "Visit plan party must match the visit log party.";
  if (plan.user_id !== userId) return "Visit plan assignee must match the visit log user.";
  return null;
}

function canEditVisitLogRow(args: {
  createdAt: string;
  logUserId: string;
  profileId: string;
  isAdmin: boolean;
}): boolean {
  if (args.isAdmin) return true;
  return isVisitLogOwnerEditableWindow(args.createdAt, args.logUserId, args.profileId);
}

export async function createVisitLogAction(
  input: CreateVisitLogInput
): Promise<ActionResult<{ visitLogId: string }>> {
  const parsed = createVisitLogSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canCreateVisitLogs(role)) {
    return { ok: false, error: "You do not have permission to create visit logs." };
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
      return { ok: false, error: "User is required." };
    }
    assigneeId = parsed.data.assignee_user_id;
    const { data: assigneeRow } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", assigneeId)
      .maybeSingle();
    if (!assigneeRow || assigneeRow.organization_id !== profile.organization_id) {
      return { ok: false, error: "User must belong to your organization." };
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

  const visitPlanId = normalizeOptionalUuid(parsed.data.visit_plan_id);
  if (visitPlanId) {
    const planErr = await assertVisitPlanLink({
      supabase,
      organizationId: profile.organization_id,
      visitPlanId,
      partyId: parsed.data.party_id,
      userId: assigneeId,
    });
    if (planErr) return { ok: false, error: planErr };
  }

  const checkIn = parseOptionalIsoTimestamptz(parsed.data.check_in_time);
  const checkOut = parseOptionalIsoTimestamptz(parsed.data.check_out_time);
  const timeOrderErr = assertCheckOutAfterCheckIn(checkIn, checkOut);
  if (timeOrderErr) return { ok: false, error: timeOrderErr };

  const inLat = parseOptionalCoord(parsed.data.check_in_lat);
  const inLng = parseOptionalCoord(parsed.data.check_in_lng);
  const outLat = parseOptionalCoord(parsed.data.check_out_lat);
  const outLng = parseOptionalCoord(parsed.data.check_out_lng);
  const inCoordErr = assertLatLng(inLat, inLng, "Check-in coordinates");
  if (inCoordErr) return { ok: false, error: inCoordErr };
  const outCoordErr = assertLatLng(outLat, outLng, "Check-out coordinates");
  if (outCoordErr) return { ok: false, error: outCoordErr };

  const notes = (parsed.data.notes ?? "").trim();
  const outcome = (parsed.data.outcome ?? "").trim();

  const { data, error } = await supabase
    .from("visit_logs")
    .insert({
      organization_id: profile.organization_id,
      party_id: parsed.data.party_id,
      user_id: assigneeId,
      visit_plan_id: visitPlanId,
      check_in_time: checkIn,
      check_out_time: checkOut,
      check_in_lat: inLat,
      check_in_lng: inLng,
      check_out_lat: outLat,
      check_out_lng: outLng,
      notes,
      outcome,
      status: parsed.data.status,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create visit log." };
  }

  revalidatePath(ROUTES.visitLogs);
  revalidatePath(`${ROUTES.visitLogs}/${data.id}`);
  return { ok: true, data: { visitLogId: data.id } };
}

export async function updateVisitLogAction(input: UpdateVisitLogInput): Promise<ActionResult> {
  const parsed = updateVisitLogSchema.safeParse(input);
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
    .from("visit_logs")
    .select("id, organization_id, user_id, created_at")
    .eq("id", parsed.data.visitLogId)
    .maybeSingle();

  if (!target || target.organization_id !== profile.organization_id) {
    return { ok: false, error: "Visit log not found in your organization." };
  }

  if (
    !canEditVisitLogRow({
      createdAt: target.created_at,
      logUserId: target.user_id,
      profileId: profile.id,
      isAdmin,
    })
  ) {
    return {
      ok: false,
      error: "You can only edit your own visit logs within 72 hours of creation.",
    };
  }

  const visitPlanId = normalizeOptionalUuid(parsed.data.visit_plan_id);

  const { data: partyRow } = await supabase
    .from("parties")
    .select("id, organization_id")
    .eq("id", parsed.data.party_id)
    .maybeSingle();
  if (!partyRow || partyRow.organization_id !== profile.organization_id) {
    return { ok: false, error: "Party not found in your organization." };
  }

  if (visitPlanId) {
    const planErr = await assertVisitPlanLink({
      supabase,
      organizationId: profile.organization_id,
      visitPlanId,
      partyId: parsed.data.party_id,
      userId: target.user_id,
    });
    if (planErr) return { ok: false, error: planErr };
  }

  const checkIn = parseOptionalIsoTimestamptz(parsed.data.check_in_time);
  const checkOut = parseOptionalIsoTimestamptz(parsed.data.check_out_time);
  const timeOrderErr = assertCheckOutAfterCheckIn(checkIn, checkOut);
  if (timeOrderErr) return { ok: false, error: timeOrderErr };

  const inLat = parseOptionalCoord(parsed.data.check_in_lat);
  const inLng = parseOptionalCoord(parsed.data.check_in_lng);
  const outLat = parseOptionalCoord(parsed.data.check_out_lat);
  const outLng = parseOptionalCoord(parsed.data.check_out_lng);
  const inCoordErr = assertLatLng(inLat, inLng, "Check-in coordinates");
  if (inCoordErr) return { ok: false, error: inCoordErr };
  const outCoordErr = assertLatLng(outLat, outLng, "Check-out coordinates");
  if (outCoordErr) return { ok: false, error: outCoordErr };

  const notes = (parsed.data.notes ?? "").trim();
  const outcome = (parsed.data.outcome ?? "").trim();

  const { error } = await supabase
    .from("visit_logs")
    .update({
      party_id: parsed.data.party_id,
      visit_plan_id: visitPlanId,
      check_in_time: checkIn,
      check_out_time: checkOut,
      check_in_lat: inLat,
      check_in_lng: inLng,
      check_out_lat: outLat,
      check_out_lng: outLng,
      notes,
      outcome,
      status: parsed.data.status,
    })
    .eq("id", parsed.data.visitLogId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(ROUTES.visitLogs);
  revalidatePath(`${ROUTES.visitLogs}/${parsed.data.visitLogId}`);
  return { ok: true };
}
