"use server";

import { revalidatePath } from "next/cache";

import type { AppRole } from "@/constants/roles";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { toSafeActionError } from "@/lib/errors/safe-action-error";
import { createClient } from "@/lib/supabase/server";
import { canManageSalesTargets, isOrgAdminRole } from "@/lib/users/actor-permissions";
import {
  createSalesTargetSchema,
  updateSalesTargetSchema,
  type CreateSalesTargetInput,
  type UpdateSalesTargetInput,
} from "@/modules/sales-targets/schemas";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

function normalizeOptionalPartyId(value: string | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  return v;
}

function normalizeOptionalTargetQty(
  raw: string | number | undefined): { ok: true; value: number | null } | { ok: false; error: string } {
  if (
    raw === undefined ||
    raw === "" ||
    (typeof raw === "number" && Number.isNaN(raw))
  ) {
    return { ok: true, value: null };
  }
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    return { ok: false, error: "Target quantity must be a valid number." };
  }
  if (n < 0) {
    return { ok: false, error: "Target quantity cannot be negative." };
  }
  return { ok: true, value: n };
}

async function assertCanAssignSalesTarget(
  supabase: Awaited<ReturnType<typeof createClient>>,
  actorProfileId: string,
  assigneeId: string,
  role: AppRole | null
): Promise<string | null> {
  if (!canManageSalesTargets(role)) {
    return "You do not have permission to assign sales targets.";
  }
  const hasOrgWide = isOrgAdminRole(role) || role === "hos";
  const { data, error } = await supabase.rpc("can_access_profile", {
    p_actor_profile_id: actorProfileId,
    p_target_profile_id: assigneeId,
    p_has_org_wide_access: hasOrgWide,
    p_max_depth: 25,
  });
  if (error) {
    return toSafeActionError(
      error,
      "Could not validate assignment scope for sales target.",
      "salesTargets.assertCanAssignSalesTarget"
    );
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !(typeof row === "object" && "can_access" in row && row.can_access)) {
    return "You cannot assign a target to this user based on your role and hierarchy.";
  }
  return null;
}

async function assertPartyInOrg(
  supabase: Awaited<ReturnType<typeof createClient>>,
  partyId: string | null,
  organizationId: string
): Promise<string | null> {
  if (!partyId) return null;
  const { data } = await supabase
    .from("parties")
    .select("id")
    .eq("id", partyId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!data) return "Party not found in your organization.";
  return null;
}

export async function createSalesTargetAction(
  input: CreateSalesTargetInput
): Promise<ActionResult<{ salesTargetId: string }>> {
  const parsed = createSalesTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canManageSalesTargets(role)) {
    return { ok: false, error: "You do not have permission to create sales targets." };
  }
  if (
    !profile?.organization_id ||
    parsed.data.organization_id !== profile.organization_id
  ) {
    return { ok: false, error: "Invalid organization." };
  }

  const assignErr = await assertCanAssignSalesTarget(
    supabase,
    profile.id,
    parsed.data.assigned_to_user_id,
    role
  );
  if (assignErr) return { ok: false, error: assignErr };

  const partyId = normalizeOptionalPartyId(parsed.data.party_id);
  const partyErr = await assertPartyInOrg(supabase, partyId, profile.organization_id);
  if (partyErr) return { ok: false, error: partyErr };

  const qtyNorm = normalizeOptionalTargetQty(parsed.data.target_qty);
  if (!qtyNorm.ok) return { ok: false, error: qtyNorm.error };

  const { data, error } = await supabase
    .from("sales_targets")
    .insert({
      organization_id: profile.organization_id,
      assigned_to_user_id: parsed.data.assigned_to_user_id,
      party_id: partyId,
      period_type: parsed.data.period_type,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      target_amount: parsed.data.target_amount,
      target_qty: qtyNorm.value,
      status: parsed.data.status,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: toSafeActionError(error, "Could not create sales target.", "salesTargets.createSalesTargetAction"),
    };
  }

  revalidatePath(ROUTES.salesTargets);
  revalidatePath(`${ROUTES.salesTargets}/${data.id}`);
  return { ok: true, data: { salesTargetId: data.id } };
}

export async function updateSalesTargetAction(
  input: UpdateSalesTargetInput
): Promise<ActionResult> {
  const parsed = updateSalesTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canManageSalesTargets(role)) {
    return { ok: false, error: "You do not have permission to update sales targets." };
  }
  if (!profile?.organization_id) {
    return { ok: false, error: "Your profile must belong to an organization." };
  }

  const { data: target } = await supabase
    .from("sales_targets")
    .select("id, organization_id")
    .eq("id", parsed.data.salesTargetId)
    .maybeSingle();

  if (!target || target.organization_id !== profile.organization_id) {
    return { ok: false, error: "Sales target not found in your organization." };
  }

  const assignErr = await assertCanAssignSalesTarget(
    supabase,
    profile.id,
    parsed.data.assigned_to_user_id,
    role
  );
  if (assignErr) return { ok: false, error: assignErr };

  const partyId = normalizeOptionalPartyId(parsed.data.party_id);
  const partyErr = await assertPartyInOrg(supabase, partyId, profile.organization_id);
  if (partyErr) return { ok: false, error: partyErr };

  const qtyNorm = normalizeOptionalTargetQty(parsed.data.target_qty);
  if (!qtyNorm.ok) return { ok: false, error: qtyNorm.error };

  const { error } = await supabase
    .from("sales_targets")
    .update({
      assigned_to_user_id: parsed.data.assigned_to_user_id,
      party_id: partyId,
      period_type: parsed.data.period_type,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      target_amount: parsed.data.target_amount,
      target_qty: qtyNorm.value,
      status: parsed.data.status,
    })
    .eq("id", parsed.data.salesTargetId);

  if (error) {
    return {
      ok: false,
      error: toSafeActionError(error, "Could not update sales target.", "salesTargets.updateSalesTargetAction"),
    };
  }

  revalidatePath(ROUTES.salesTargets);
  revalidatePath(`${ROUTES.salesTargets}/${parsed.data.salesTargetId}`);
  return { ok: true };
}
