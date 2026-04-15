"use server";

import { revalidatePath } from "next/cache";

import type { AppRole } from "@/constants/roles";
import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { toSafeActionError } from "@/lib/errors/safe-action-error";
import { createClient } from "@/lib/supabase/server";
import { canManageCollectionTargets, isOrgAdminRole } from "@/lib/users/actor-permissions";
import {
  createCollectionTargetSchema,
  updateCollectionTargetSchema,
  type CreateCollectionTargetInput,
  type UpdateCollectionTargetInput,
} from "@/modules/collection-targets/schemas";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

function normalizeOptionalPartyId(value: string | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  return v;
}

async function assertCanAssignCollectionTarget(
  supabase: Awaited<ReturnType<typeof createClient>>,
  actorProfileId: string,
  assigneeId: string,
  role: AppRole | null
): Promise<string | null> {
  if (!canManageCollectionTargets(role)) {
    return "You do not have permission to assign collection targets.";
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
      "Could not validate assignment scope for collection target.",
      "collectionTargets.assertCanAssignCollectionTarget"
    );
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !(typeof row === "object" && "can_access" in row && row.can_access)) {
    return "You cannot assign a collection target to this user based on your role and hierarchy.";
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

export async function createCollectionTargetAction(
  input: CreateCollectionTargetInput
): Promise<ActionResult<{ collectionTargetId: string }>> {
  const parsed = createCollectionTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canManageCollectionTargets(role)) {
    return { ok: false, error: "You do not have permission to create collection targets." };
  }
  if (
    !profile?.organization_id ||
    parsed.data.organization_id !== profile.organization_id
  ) {
    return { ok: false, error: "Invalid organization." };
  }

  const assignErr = await assertCanAssignCollectionTarget(
    supabase,
    profile.id,
    parsed.data.assigned_to_user_id,
    role
  );
  if (assignErr) return { ok: false, error: assignErr };

  const partyId = normalizeOptionalPartyId(parsed.data.party_id);
  const partyErr = await assertPartyInOrg(supabase, partyId, profile.organization_id);
  if (partyErr) return { ok: false, error: partyErr };

  const { data, error } = await supabase
    .from("collection_targets")
    .insert({
      organization_id: profile.organization_id,
      assigned_to_user_id: parsed.data.assigned_to_user_id,
      party_id: partyId,
      period_type: parsed.data.period_type,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      target_amount: parsed.data.target_amount,
      status: parsed.data.status,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: toSafeActionError(
        error,
        "Could not create collection target.",
        "collectionTargets.createCollectionTargetAction"
      ),
    };
  }

  revalidatePath(ROUTES.collectionTargets);
  revalidatePath(`${ROUTES.collectionTargets}/${data.id}`);
  return { ok: true, data: { collectionTargetId: data.id } };
}

export async function updateCollectionTargetAction(
  input: UpdateCollectionTargetInput
): Promise<ActionResult> {
  const parsed = updateCollectionTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  if (!canManageCollectionTargets(role)) {
    return { ok: false, error: "You do not have permission to update collection targets." };
  }
  if (!profile?.organization_id) {
    return { ok: false, error: "Your profile must belong to an organization." };
  }

  const { data: target } = await supabase
    .from("collection_targets")
    .select("id, organization_id")
    .eq("id", parsed.data.collectionTargetId)
    .maybeSingle();

  if (!target || target.organization_id !== profile.organization_id) {
    return { ok: false, error: "Collection target not found in your organization." };
  }

  const assignErr = await assertCanAssignCollectionTarget(
    supabase,
    profile.id,
    parsed.data.assigned_to_user_id,
    role
  );
  if (assignErr) return { ok: false, error: assignErr };

  const partyId = normalizeOptionalPartyId(parsed.data.party_id);
  const partyErr = await assertPartyInOrg(supabase, partyId, profile.organization_id);
  if (partyErr) return { ok: false, error: partyErr };

  const { error } = await supabase
    .from("collection_targets")
    .update({
      assigned_to_user_id: parsed.data.assigned_to_user_id,
      party_id: partyId,
      period_type: parsed.data.period_type,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      target_amount: parsed.data.target_amount,
      status: parsed.data.status,
    })
    .eq("id", parsed.data.collectionTargetId);

  if (error) {
    return {
      ok: false,
      error: toSafeActionError(
        error,
        "Could not update collection target.",
        "collectionTargets.updateCollectionTargetAction"
      ),
    };
  }

  revalidatePath(ROUTES.collectionTargets);
  revalidatePath(`${ROUTES.collectionTargets}/${parsed.data.collectionTargetId}`);
  return { ok: true };
}
