"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { canMutateParties } from "@/lib/users/actor-permissions";
import {
  createPartySchema,
  updatePartySchema,
  type CreatePartyInput,
  type UpdatePartyInput,
} from "@/modules/parties/schemas";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function createPartyAction(
  input: CreatePartyInput
): Promise<ActionResult<{ partyId: string }>> {
  const parsed = createPartySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const actorRole = resolveAppRole(user, profile);

  if (!canMutateParties(actorRole)) {
    return { ok: false, error: "You do not have permission to create parties." };
  }
  if (
    !profile?.organization_id ||
    parsed.data.organization_id !== profile.organization_id
  ) {
    return { ok: false, error: "Invalid organization." };
  }

  if (parsed.data.assigned_to_user_id) {
    const { data: assignee } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", parsed.data.assigned_to_user_id)
      .maybeSingle();
    if (!assignee || assignee.organization_id !== profile.organization_id) {
      return { ok: false, error: "Assigned user must belong to your organization." };
    }
  }

  const { data, error } = await supabase
    .from("parties")
    .insert({
      organization_id: parsed.data.organization_id,
      name: parsed.data.name.trim(),
      code: parsed.data.code?.trim() || null,
      assigned_to_user_id: parsed.data.assigned_to_user_id || null,
      contact_person: parsed.data.contact_person?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
      email: parsed.data.email?.trim().toLowerCase() || null,
      address: parsed.data.address?.trim() || null,
      notes: parsed.data.notes?.trim() || null,
      status: parsed.data.status,
      created_by_user_id: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create party." };
  }

  revalidatePath(ROUTES.parties);
  revalidatePath(`${ROUTES.parties}/${data.id}`);
  return { ok: true, data: { partyId: data.id } };
}

export async function updatePartyAction(input: UpdatePartyInput): Promise<ActionResult> {
  const parsed = updatePartySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const actorRole = resolveAppRole(user, profile);

  if (!canMutateParties(actorRole)) {
    return { ok: false, error: "You do not have permission to update parties." };
  }
  if (!profile?.organization_id) {
    return { ok: false, error: "Your profile is missing an organization." };
  }

  const { data: target } = await supabase
    .from("parties")
    .select("organization_id")
    .eq("id", parsed.data.partyId)
    .maybeSingle();
  if (!target || target.organization_id !== profile.organization_id) {
    return { ok: false, error: "Party not found in your organization." };
  }

  if (parsed.data.assigned_to_user_id) {
    const { data: assignee } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", parsed.data.assigned_to_user_id)
      .maybeSingle();
    if (!assignee || assignee.organization_id !== profile.organization_id) {
      return { ok: false, error: "Assigned user must belong to your organization." };
    }
  }

  const { error } = await supabase
    .from("parties")
    .update({
      name: parsed.data.name.trim(),
      code: parsed.data.code?.trim() || null,
      assigned_to_user_id: parsed.data.assigned_to_user_id || null,
      contact_person: parsed.data.contact_person?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
      email: parsed.data.email?.trim().toLowerCase() || null,
      address: parsed.data.address?.trim() || null,
      notes: parsed.data.notes?.trim() || null,
      status: parsed.data.status,
    })
    .eq("id", parsed.data.partyId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(ROUTES.parties);
  revalidatePath(`${ROUTES.parties}/${parsed.data.partyId}`);
  return { ok: true };
}
