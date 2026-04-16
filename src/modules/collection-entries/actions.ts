"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { toSafeActionError } from "@/lib/errors/safe-action-error";
import { createClient } from "@/lib/supabase/server";
import {
  canCreateCollectionEntries,
  canVerifyCollectionEntries,
  isOrgAdminRole,
} from "@/lib/users/actor-permissions";
import {
  createCollectionEntrySchema,
  isCollectionEntryOwnerEditableWindow,
  updateCollectionEntrySchema,
  verifyCollectionEntrySchema,
  type CreateCollectionEntryInput,
  type UpdateCollectionEntryInput,
  type VerifyCollectionEntryInput,
} from "@/modules/collection-entries/schemas";

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

export async function createCollectionEntryAction(
  input: CreateCollectionEntryInput
): Promise<ActionResult<{ collectionEntryId: string }>> {
  const parsed = createCollectionEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canCreateCollectionEntries(role)) {
    return { ok: false, error: "You do not have permission to create collection entries." };
  }
  if (
    !profile?.organization_id ||
    parsed.data.organization_id !== profile.organization_id
  ) {
    return { ok: false, error: "Invalid organization." };
  }

  const isAdmin = isOrgAdminRole(role);
  let collectorId = profile.id;
  if (isAdmin) {
    if (!parsed.data.assignee_user_id) {
      return { ok: false, error: "User is required." };
    }
    collectorId = parsed.data.assignee_user_id;
    const { data: assigneeRow } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", collectorId)
      .maybeSingle();
    if (!assigneeRow || assigneeRow.organization_id !== profile.organization_id) {
      return { ok: false, error: "User must belong to your organization." };
    }
  }

  const partyErr = await assertPartyInOrg(supabase, parsed.data.party_id, profile.organization_id);
  if (partyErr) return { ok: false, error: partyErr };

  const remarks = (parsed.data.remarks ?? "").trim();

  const { data, error } = await supabase
    .from("collection_entries")
    .insert({
      organization_id: profile.organization_id,
      user_id: collectorId,
      party_id: parsed.data.party_id,
      entry_date: parsed.data.entry_date,
      amount: parsed.data.amount,
      remarks,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: toSafeActionError(
        error,
        "Could not create collection entry.",
        "collectionEntries.createCollectionEntryAction"
      ),
    };
  }

  revalidatePath(ROUTES.collectionEntries);
  revalidatePath(`${ROUTES.collectionEntries}/${data.id}`);
  return { ok: true, data: { collectionEntryId: data.id } };
}

export async function updateCollectionEntryAction(
  input: UpdateCollectionEntryInput
): Promise<ActionResult> {
  const parsed = updateCollectionEntrySchema.safeParse(input);
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
    .from("collection_entries")
    .select("id, organization_id, user_id, created_at, verification_status")
    .eq("id", parsed.data.collectionEntryId)
    .maybeSingle();

  if (!target || target.organization_id !== profile.organization_id) {
    return { ok: false, error: "Collection entry not found in your organization." };
  }

  if (!isAdmin) {
    if (target.verification_status !== "unverified") {
      return {
        ok: false,
        error: "Verified or rejected entries cannot be edited except by an admin.",
      };
    }
    const canOwnerEdit = isCollectionEntryOwnerEditableWindow(
      target.created_at,
      target.user_id,
      profile.id
    );
    if (!canOwnerEdit) {
      return {
        ok: false,
        error:
          "You can only edit your own unverified collection entries within 72 hours of creation, unless you are an admin.",
      };
    }
  }

  const partyErr = await assertPartyInOrg(supabase, parsed.data.party_id, profile.organization_id);
  if (partyErr) return { ok: false, error: partyErr };

  const remarks = (parsed.data.remarks ?? "").trim();

  const { data: updatedRow, error } = await supabase
    .from("collection_entries")
    .update({
      party_id: parsed.data.party_id,
      entry_date: parsed.data.entry_date,
      amount: parsed.data.amount,
      remarks,
    })
    .eq("id", parsed.data.collectionEntryId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: toSafeActionError(
        error,
        "Could not update collection entry.",
        "collectionEntries.updateCollectionEntryAction"
      ),
    };
  }
  if (!updatedRow) {
    return {
      ok: false,
      error: "Collection entry could not be updated (it may no longer be editable). Refresh and try again.",
    };
  }

  revalidatePath(ROUTES.collectionEntries);
  revalidatePath(`${ROUTES.collectionEntries}/${parsed.data.collectionEntryId}`);
  return { ok: true };
}

export async function verifyCollectionEntryAction(
  input: VerifyCollectionEntryInput
): Promise<ActionResult> {
  const parsed = verifyCollectionEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canVerifyCollectionEntries(role)) {
    return { ok: false, error: "You do not have permission to verify collection entries." };
  }
  if (!profile?.organization_id) {
    return { ok: false, error: "Your profile must belong to an organization." };
  }

  const { data: target } = await supabase
    .from("collection_entries")
    .select("id, organization_id, verification_status")
    .eq("id", parsed.data.collectionEntryId)
    .maybeSingle();

  if (!target || target.organization_id !== profile.organization_id) {
    return { ok: false, error: "Collection entry not found in your organization." };
  }
  if (target.verification_status !== "unverified") {
    return { ok: false, error: "Only unverified entries can be verified or rejected." };
  }

  const { data: verifiedRow, error } = await supabase
    .from("collection_entries")
    .update({ verification_status: parsed.data.verification_status })
    .eq("id", parsed.data.collectionEntryId)
    .eq("verification_status", "unverified")
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: toSafeActionError(
        error,
        "Could not verify collection entry.",
        "collectionEntries.verifyCollectionEntryAction"
      ),
    };
  }
  if (!verifiedRow) {
    return {
      ok: false,
      error: "This entry is not unverified or was already processed. Refresh and try again.",
    };
  }

  revalidatePath(ROUTES.collectionEntries);
  revalidatePath(`${ROUTES.collectionEntries}/${parsed.data.collectionEntryId}`);
  return { ok: true };
}
