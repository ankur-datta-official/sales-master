"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { canMutateOrgUsers } from "@/lib/users/actor-permissions";

import {
  createOrgUserSchema,
  updateOrgUserSchema,
  type CreateOrgUserInput,
  type UpdateOrgUserInput,
} from "@/modules/users/schemas";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function createOrgUserAction(
  input: CreateOrgUserInput
): Promise<ActionResult<{ userId: string }>> {
  const parsed = createOrgUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user: actorUser, profile: actorProfile } = await requireUserProfile();
  const actorRole = resolveAppRole(actorUser, actorProfile);

  if (!canMutateOrgUsers(actorRole)) {
    return { ok: false, error: "You do not have permission to create users." };
  }

  if (
    !actorProfile?.organization_id ||
    parsed.data.organization_id !== actorProfile.organization_id
  ) {
    return { ok: false, error: "Invalid organization." };
  }

  if (parsed.data.reports_to_user_id) {
    const { data: mgr } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", parsed.data.reports_to_user_id)
      .maybeSingle();

    if (!mgr || mgr.organization_id !== parsed.data.organization_id) {
      return {
        ok: false,
        error: "Reporting manager must belong to the same organization.",
      };
    }
  }

  let service: ReturnType<typeof createServiceRoleClient>;
  try {
    service = createServiceRoleClient();
  } catch {
    return {
      ok: false,
      error:
        "User provisioning is not configured (missing SUPABASE_SERVICE_ROLE_KEY on the server).",
    };
  }

  const email = parsed.data.email.trim().toLowerCase();

  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name },
  });

  if (createErr || !created.user) {
    return {
      ok: false,
      error: createErr?.message ?? "Could not create authentication user.",
    };
  }

  const newId = created.user.id;

  const { error: upErr } = await service
    .from("profiles")
    .update({
      organization_id: parsed.data.organization_id,
      branch_id: parsed.data.branch_id ?? null,
      role_id: parsed.data.role_id,
      reports_to_user_id: parsed.data.reports_to_user_id ?? null,
      full_name: parsed.data.full_name,
      email,
      status: parsed.data.status,
      phone: parsed.data.phone ?? null,
      employee_code: parsed.data.employee_code ?? null,
      designation: parsed.data.designation ?? null,
    })
    .eq("id", newId);

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  revalidatePath(ROUTES.users);
  revalidatePath(`${ROUTES.users}/${newId}`);
  return { ok: true, data: { userId: newId } };
}

export async function updateOrgUserAction(
  input: UpdateOrgUserInput
): Promise<ActionResult> {
  const parsed = updateOrgUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { user: actorUser, profile: actorProfile } = await requireUserProfile();
  const actorRole = resolveAppRole(actorUser, actorProfile);

  if (!canMutateOrgUsers(actorRole)) {
    return { ok: false, error: "You do not have permission to update users." };
  }

  if (!actorProfile?.organization_id) {
    return { ok: false, error: "Your profile is missing an organization." };
  }

  const { data: target } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", parsed.data.userId)
    .maybeSingle();

  if (!target || target.organization_id !== actorProfile.organization_id) {
    return { ok: false, error: "User not found in your organization." };
  }

  if (parsed.data.reports_to_user_id === parsed.data.userId) {
    return { ok: false, error: "A user cannot report to themselves." };
  }

  if (parsed.data.reports_to_user_id) {
    const { data: mgr } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", parsed.data.reports_to_user_id)
      .maybeSingle();

    if (!mgr || mgr.organization_id !== actorProfile.organization_id) {
      return {
        ok: false,
        error: "Reporting manager must belong to the same organization.",
      };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      role_id: parsed.data.role_id,
      branch_id: parsed.data.branch_id ?? null,
      reports_to_user_id: parsed.data.reports_to_user_id ?? null,
      status: parsed.data.status,
      phone: parsed.data.phone ?? null,
      employee_code: parsed.data.employee_code ?? null,
      designation: parsed.data.designation ?? null,
    })
    .eq("id", parsed.data.userId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(ROUTES.users);
  revalidatePath(`${ROUTES.users}/${parsed.data.userId}`);
  return { ok: true };
}
