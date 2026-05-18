import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { ROUTES } from "@/config/routes";
import type { AppRole } from "@/constants/roles";
import { resolveAppRole } from "@/lib/auth/app-role";
import { isSafeRelativePath } from "@/lib/auth/safe-redirect";
import { fetchProfileByUserId } from "@/lib/profiles/fetch-profile";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types/profile";
import type {
  AuthAccessReason,
  AuthAccessState,
  JoinRequestStatus,
  OrganizationJoinRequest,
} from "@/modules/auth/types";
import { getPostLoginRedirectPath } from "@/lib/auth/post-login-redirect";

function isJoinRequestsTableMissing(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes(
      "could not find the table 'public.organization_join_requests'"
    ) || normalized.includes('relation "public.organization_join_requests" does not exist')
  );
}

function normalizeJoinRequestStatus(value: unknown): JoinRequestStatus {
  if (
    value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "pending";
}

function toJoinRequest(
  row: Record<string, unknown> | null | undefined
): OrganizationJoinRequest | null {
  if (!row || typeof row.id !== "string" || typeof row.user_id !== "string") {
    return null;
  }

  const org = row.organizations;
  const organization =
    org && typeof org === "object" && !Array.isArray(org)
      ? (org as Record<string, unknown>)
      : null;

  return {
    id: row.id,
    organization_id:
      typeof row.organization_id === "string" ? row.organization_id : "",
    organization_name:
      organization && typeof organization.name === "string"
        ? organization.name
        : null,
    organization_slug:
      organization && typeof organization.slug === "string"
        ? organization.slug
        : null,
    user_id: row.user_id,
    email: typeof row.email === "string" ? row.email : "",
    full_name: typeof row.full_name === "string" ? row.full_name : "",
    requested_role_id:
      typeof row.requested_role_id === "string" ? row.requested_role_id : null,
    requested_branch_id:
      typeof row.requested_branch_id === "string"
        ? row.requested_branch_id
        : null,
    note: typeof row.note === "string" ? row.note : null,
    status: normalizeJoinRequestStatus(row.status),
    reviewed_by:
      typeof row.reviewed_by === "string" ? row.reviewed_by : null,
    reviewed_at:
      typeof row.reviewed_at === "string" ? row.reviewed_at : null,
    review_note:
      typeof row.review_note === "string" ? row.review_note : null,
    created_at:
      typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    updated_at:
      typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
  };
}

export type AuthAccessContext = {
  state: AuthAccessState;
  reason: AuthAccessReason;
  user: User | null;
  profile: UserProfile | null;
  role: AppRole | null;
  latestJoinRequest: OrganizationJoinRequest | null;
};

export async function fetchLatestJoinRequestForUser(
  userId: string
): Promise<OrganizationJoinRequest | null> {
  let service: ReturnType<typeof createServiceRoleClient>;
  try {
    service = createServiceRoleClient();
  } catch {
    return null;
  }

  const { data, error } = await service
    .from("organization_join_requests")
    .select(
      "id, organization_id, user_id, email, full_name, requested_role_id, requested_branch_id, note, status, reviewed_by, reviewed_at, review_note, created_at, updated_at, organizations ( name, slug )"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (!isJoinRequestsTableMissing(error.message) && process.env.NODE_ENV !== "production") {
      console.error("[auth] join request lookup failed", error.message);
    }
    return null;
  }

  return toJoinRequest((data as Record<string, unknown> | null) ?? null);
}

export function resolveAuthAccessContext(args: {
  user: User | null;
  profile: UserProfile | null;
  role: AppRole | null;
  latestJoinRequest: OrganizationJoinRequest | null;
}): AuthAccessContext {
  const { user, profile, role, latestJoinRequest } = args;

  if (!user) {
    return {
      state: "unauthenticated",
      reason: "no_session",
      user: null,
      profile: null,
      role: null,
      latestJoinRequest: null,
    };
  }

  const status = profile?.status;
  if (status === "inactive") {
    return {
      state: "blocked",
      reason: "inactive_profile",
      user,
      profile,
      role,
      latestJoinRequest,
    };
  }

  if (status === "suspended") {
    return {
      state: "blocked",
      reason: "suspended_profile",
      user,
      profile,
      role,
      latestJoinRequest,
    };
  }

  if (profile?.organization_id && role) {
    return {
      state: "active",
      reason: "no_assignment",
      user,
      profile,
      role,
      latestJoinRequest,
    };
  }

  if (latestJoinRequest?.status === "rejected") {
    return {
      state: "blocked",
      reason: "rejected_request",
      user,
      profile,
      role,
      latestJoinRequest,
    };
  }

  if (latestJoinRequest?.status === "pending") {
    return {
      state: "pending",
      reason: "pending_request",
      user,
      profile,
      role,
      latestJoinRequest,
    };
  }

  return {
    state: "pending",
    reason: "no_assignment",
    user,
    profile,
    role,
    latestJoinRequest,
  };
}

export const getCurrentAuthAccessContext = cache(
  async (): Promise<AuthAccessContext> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return resolveAuthAccessContext({
        user: null,
        profile: null,
        role: null,
        latestJoinRequest: null,
      });
    }

    const profile = await fetchProfileByUserId(supabase, user.id);
    const role = resolveAppRole(user, profile);
    const latestJoinRequest = await fetchLatestJoinRequestForUser(user.id);

    return resolveAuthAccessContext({
      user,
      profile,
      role,
      latestJoinRequest,
    });
  }
);

export function getPostAuthRedirectPath(
  context: AuthAccessContext,
  nextParam?: string | null
) {
  if (context.state === "active") {
    const safeNext =
      nextParam && isSafeRelativePath(nextParam) ? nextParam : null;
    return getPostLoginRedirectPath(context.role, { next: safeNext });
  }

  if (context.state === "pending" || context.state === "blocked") {
    return ROUTES.pendingAccess;
  }

  return ROUTES.login;
}

