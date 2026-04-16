"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { toSafeActionError } from "@/lib/errors/safe-action-error";
import { createClient } from "@/lib/supabase/server";
import { canCreateSalesEntries, isOrgAdminRole } from "@/lib/users/actor-permissions";
import {
  createSalesEntrySchema,
  isSalesEntryOwnerEditableWindow,
  updateSalesEntrySchema,
  type CreateSalesEntryInput,
  type UpdateSalesEntryInput,
} from "@/modules/sales-entries/schemas";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

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

export async function createSalesEntryAction(
  input: CreateSalesEntryInput
): Promise<ActionResult<{ salesEntryId: string }>> {
  const parsed = createSalesEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canCreateSalesEntries(role)) {
    return { ok: false, error: "You do not have permission to create sales entries." };
  }
  if (
    !profile?.organization_id ||
    parsed.data.organization_id !== profile.organization_id
  ) {
    return { ok: false, error: "Invalid organization." };
  }

  const isAdmin = isOrgAdminRole(role);
  let sellerId = profile.id;
  if (isAdmin) {
    if (!parsed.data.assignee_user_id) {
      return { ok: false, error: "User is required." };
    }
    sellerId = parsed.data.assignee_user_id;
    const { data: assigneeRow } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", sellerId)
      .maybeSingle();
    if (!assigneeRow || assigneeRow.organization_id !== profile.organization_id) {
      return { ok: false, error: "User must belong to your organization." };
    }
  }

  const partyErr = await assertPartyInOrg(supabase, parsed.data.party_id, profile.organization_id);
  if (partyErr) return { ok: false, error: partyErr };

  const remarks = (parsed.data.remarks ?? "").trim();

  const { data, error } = await supabase
    .from("sales_entries")
    .insert({
      organization_id: profile.organization_id,
      user_id: sellerId,
      party_id: parsed.data.party_id,
      entry_date: parsed.data.entry_date,
      amount: parsed.data.amount,
      quantity: parsed.data.quantity,
      remarks,
      source: parsed.data.source,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: toSafeActionError(error, "Could not create sales entry.", "salesEntries.createSalesEntryAction"),
    };
  }

  revalidatePath(ROUTES.salesEntries);
  revalidatePath(`${ROUTES.salesEntries}/${data.id}`);
  return { ok: true, data: { salesEntryId: data.id } };
}

export async function updateSalesEntryAction(input: UpdateSalesEntryInput): Promise<ActionResult> {
  const parsed = updateSalesEntrySchema.safeParse(input);
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
    .from("sales_entries")
    .select("id, organization_id, user_id, created_at")
    .eq("id", parsed.data.salesEntryId)
    .maybeSingle();

  if (!target || target.organization_id !== profile.organization_id) {
    return { ok: false, error: "Sales entry not found in your organization." };
  }

  const canOwnerEdit = isSalesEntryOwnerEditableWindow(
    target.created_at,
    target.user_id,
    profile.id
  );
  if (!isAdmin && !canOwnerEdit) {
    return {
      ok: false,
      error:
        "You can only edit your own sales entries within 72 hours of creation, unless you are an admin.",
    };
  }

  const partyErr = await assertPartyInOrg(supabase, parsed.data.party_id, profile.organization_id);
  if (partyErr) return { ok: false, error: partyErr };

  const remarks = (parsed.data.remarks ?? "").trim();

  const { data: updatedRow, error } = await supabase
    .from("sales_entries")
    .update({
      party_id: parsed.data.party_id,
      entry_date: parsed.data.entry_date,
      amount: parsed.data.amount,
      quantity: parsed.data.quantity,
      remarks,
    })
    .eq("id", parsed.data.salesEntryId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: toSafeActionError(error, "Could not update sales entry.", "salesEntries.updateSalesEntryAction"),
    };
  }
  if (!updatedRow) {
    return {
      ok: false,
      error: "Sales entry could not be updated (it may no longer be editable). Refresh and try again.",
    };
  }

  revalidatePath(ROUTES.salesEntries);
  revalidatePath(`${ROUTES.salesEntries}/${parsed.data.salesEntryId}`);
  return { ok: true };
}
