"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { toSafeActionError } from "@/lib/errors/safe-action-error";
import { fetchProfileByUserId } from "@/lib/profiles/fetch-profile";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { canMutateOrgUsers } from "@/lib/users/actor-permissions";
import {
  createWorkspaceSignUpSchema,
  forgotPasswordSchema,
  joinWorkspaceSignUpSchema,
  reviewJoinRequestSchema,
  sendUserSetupLinkSchema,
} from "@/modules/auth/schemas";
import { buildRecoveryRedirectUrl } from "@/modules/auth/utils";

export type AuthActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function getServiceClientOrError() {
  try {
    return { service: createServiceRoleClient(), error: null };
  } catch {
    return {
      service: null,
      error: "Authentication provisioning is not configured for this environment.",
    };
  }
}

export async function createWorkspaceSignUpAction(
  input: unknown
): Promise<AuthActionResult<{ email: string }>> {
  const parsed = createWorkspaceSignUpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((issue) => issue.message).join("; "),
    };
  }

  const serviceResult = await getServiceClientOrError();
  if (!serviceResult.service) {
    return { ok: false, error: serviceResult.error! };
  }

  const service = serviceResult.service;
  const email = parsed.data.email.trim().toLowerCase();
  const slug = parsed.data.workspace_slug.trim().toLowerCase();

  const { data: organization, error: organizationError } = await service
    .from("organizations")
    .insert({
      name: parsed.data.organization_name.trim(),
      slug,
      status: "active",
    })
    .select("id, name, slug")
    .single();

  if (organizationError || !organization) {
    return {
      ok: false,
      error: toSafeActionError(
        organizationError,
        "Could not create the workspace. Try a different workspace slug.",
        "auth.createWorkspaceSignUpAction.createOrganization"
      ),
    };
  }

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name.trim() },
  });

  if (createError || !created.user) {
    await service.from("organizations").delete().eq("id", organization.id);
    return {
      ok: false,
      error: toSafeActionError(
        createError,
        "Could not create your account. Please try again.",
        "auth.createWorkspaceSignUpAction.createUser"
      ),
    };
  }

  const userId = created.user.id;

  const { data: branch, error: branchError } = await service
    .from("branches")
    .insert({
      organization_id: organization.id,
      name: "Head Office",
      code: "HO",
      is_head_office: true,
      status: "active",
    })
    .select("id")
    .single();

  if (branchError || !branch) {
    await service.auth.admin.deleteUser(userId);
    await service.from("organizations").delete().eq("id", organization.id);
    return {
      ok: false,
      error: toSafeActionError(
        branchError,
        "Could not finish workspace setup.",
        "auth.createWorkspaceSignUpAction.createBranch"
      ),
    };
  }

  const { data: roleRow, error: roleError } = await service
    .from("roles")
    .select("id")
    .is("organization_id", null)
    .eq("slug", "admin")
    .maybeSingle();

  if (roleError || !roleRow?.id) {
    await service.auth.admin.deleteUser(userId);
    await service.from("organizations").delete().eq("id", organization.id);
    return {
      ok: false,
      error: "Workspace admin role is missing. Please contact support.",
    };
  }

  const { error: profileError } = await service
    .from("profiles")
    .update({
      organization_id: organization.id,
      branch_id: branch.id,
      role_id: roleRow.id,
      full_name: parsed.data.full_name.trim(),
      email,
      status: "active",
      joined_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (profileError) {
    await service.auth.admin.deleteUser(userId);
    await service.from("organizations").delete().eq("id", organization.id);
    return {
      ok: false,
      error: toSafeActionError(
        profileError,
        "Could not activate your workspace account.",
        "auth.createWorkspaceSignUpAction.updateProfile"
      ),
    };
  }

  return { ok: true, data: { email } };
}

export async function joinWorkspaceSignUpAction(
  input: unknown
): Promise<AuthActionResult<{ email: string }>> {
  const parsed = joinWorkspaceSignUpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((issue) => issue.message).join("; "),
    };
  }

  const serviceResult = await getServiceClientOrError();
  if (!serviceResult.service) {
    return { ok: false, error: serviceResult.error! };
  }

  const service = serviceResult.service;
  const email = parsed.data.email.trim().toLowerCase();
  const slug = parsed.data.workspace_slug.trim().toLowerCase();

  const { data: organization, error: organizationError } = await service
    .from("organizations")
    .select("id, name, slug, status")
    .eq("slug", slug)
    .maybeSingle();

  if (organizationError || !organization || organization.status !== "active") {
    return {
      ok: false,
      error: "That workspace could not be found or is not accepting new users.",
    };
  }

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name.trim() },
  });

  if (createError || !created.user) {
    return {
      ok: false,
      error: toSafeActionError(
        createError,
        "Could not create your account. Please try again.",
        "auth.joinWorkspaceSignUpAction.createUser"
      ),
    };
  }

  const userId = created.user.id;
  const now = new Date().toISOString();

  const { error: profileError } = await service
    .from("profiles")
    .update({
      full_name: parsed.data.full_name.trim(),
      email,
      status: "invited",
    })
    .eq("id", userId);

  if (profileError) {
    await service.auth.admin.deleteUser(userId);
    return {
      ok: false,
      error: toSafeActionError(
        profileError,
        "Could not prepare your pending access request.",
        "auth.joinWorkspaceSignUpAction.updateProfile"
      ),
    };
  }

  const { error: joinError } = await service.from("organization_join_requests").insert({
    organization_id: organization.id,
    user_id: userId,
    email,
    full_name: parsed.data.full_name.trim(),
    note: parsed.data.note?.trim() || null,
    status: "pending",
    created_at: now,
    updated_at: now,
  });

  if (joinError) {
    await service.auth.admin.deleteUser(userId);
    return {
      ok: false,
      error: toSafeActionError(
        joinError,
        "Could not submit your workspace access request.",
        "auth.joinWorkspaceSignUpAction.insertJoinRequest"
      ),
    };
  }

  return { ok: true, data: { email } };
}

export async function requestPasswordResetAction(
  input: unknown
): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((issue) => issue.message).join("; "),
    };
  }

  const supabase = await createClient();
  const redirectTo = await buildRecoveryRedirectUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email.trim().toLowerCase(),
    { redirectTo }
  );

  if (error) {
    return {
      ok: false,
      error: toSafeActionError(
        error,
        "Could not send the password reset link right now.",
        "auth.requestPasswordResetAction"
      ),
    };
  }

  return { ok: true };
}

export async function reviewJoinRequestAction(
  input: unknown
): Promise<AuthActionResult> {
  const parsed = reviewJoinRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((issue) => issue.message).join("; "),
    };
  }

  const { user: actorUser, profile: actorProfile } = await requireUserProfile();
  const actorRole = resolveAppRole(actorUser, actorProfile);
  if (!canMutateOrgUsers(actorRole) || !actorProfile?.organization_id) {
    return { ok: false, error: "You do not have permission to review join requests." };
  }

  const serviceResult = await getServiceClientOrError();
  if (!serviceResult.service) {
    return { ok: false, error: serviceResult.error! };
  }

  const service = serviceResult.service;

  const { data: requestRow, error: requestError } = await service
    .from("organization_join_requests")
    .select("id, organization_id, user_id, email, full_name, status")
    .eq("id", parsed.data.requestId)
    .maybeSingle();

  if (requestError || !requestRow) {
    return { ok: false, error: "Join request not found." };
  }

  if (requestRow.organization_id !== actorProfile.organization_id) {
    return { ok: false, error: "That join request does not belong to your workspace." };
  }

  const isApprove = parsed.data.decision === "approve";
  if (isApprove && !parsed.data.role_id) {
    return { ok: false, error: "Select a role before approving the request." };
  }

  const reviewPayload = {
    status: isApprove ? "approved" : "rejected",
    reviewed_by: actorProfile.id,
    reviewed_at: new Date().toISOString(),
    review_note: parsed.data.review_note?.trim() || null,
  };

  if (isApprove) {
    const { error: profileError } = await service
      .from("profiles")
      .update({
        organization_id: actorProfile.organization_id,
        role_id: parsed.data.role_id,
        branch_id: parsed.data.branch_id ?? null,
        status: "active",
        joined_at: new Date().toISOString(),
      })
      .eq("id", requestRow.user_id);

    if (profileError) {
      return {
        ok: false,
        error: toSafeActionError(
          profileError,
          "Could not activate the user profile.",
          "auth.reviewJoinRequestAction.activateProfile"
        ),
      };
    }
  }

  const { error: updateError } = await service
    .from("organization_join_requests")
    .update(reviewPayload)
    .eq("id", parsed.data.requestId);

  if (updateError) {
    return {
      ok: false,
      error: toSafeActionError(
        updateError,
        "Could not update the join request status.",
        "auth.reviewJoinRequestAction.updateJoinRequest"
      ),
    };
  }

  revalidatePath(ROUTES.users);
  revalidatePath(ROUTES.pendingAccess);
  return { ok: true };
}

export async function sendUserSetupLinkAction(
  input: unknown
): Promise<AuthActionResult> {
  const parsed = sendUserSetupLinkSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((issue) => issue.message).join("; "),
    };
  }

  const { user: actorUser, profile: actorProfile } = await requireUserProfile();
  const actorRole = resolveAppRole(actorUser, actorProfile);
  if (!canMutateOrgUsers(actorRole) || !actorProfile?.organization_id) {
    return { ok: false, error: "You do not have permission to send setup links." };
  }

  const supabase = await createClient();
  const targetProfile = await fetchProfileByUserId(supabase, parsed.data.userId);

  if (!targetProfile?.email || targetProfile.organization_id !== actorProfile.organization_id) {
    return { ok: false, error: "User not found in your workspace." };
  }

  const serviceResult = await getServiceClientOrError();
  if (!serviceResult.service) {
    return { ok: false, error: serviceResult.error! };
  }

  const redirectTo = await buildRecoveryRedirectUrl();
  const { error } = await serviceResult.service.auth.admin.inviteUserByEmail(
    targetProfile.email,
    {
      data: { full_name: targetProfile.full_name },
      redirectTo,
    }
  );

  if (error) {
    return {
      ok: false,
      error: toSafeActionError(
        error,
        "Could not send the setup link right now.",
        "auth.sendUserSetupLinkAction"
      ),
    };
  }

  return { ok: true };
}
