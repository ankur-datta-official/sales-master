import { ROUTES } from "@/config/routes";
import type { AppRole } from "@/constants/roles";

import { isSafeRelativePath } from "@/lib/auth/safe-redirect";

/** Explicit home route per role after sign-in (extend when modules add role-specific homes). */
const ROLE_HOME = {
  admin: ROUTES.dashboard,
  hos: ROUTES.dashboard,
  manager: ROUTES.dashboard,
  assistant_manager: ROUTES.dashboard,
  marketer: ROUTES.dashboard,
  accounts: ROUTES.dashboard,
  factory_operator: ROUTES.dashboard,
} satisfies Record<AppRole, string>;

/**
 * Where to send the user after a successful sign-in.
 * Honors a validated `next` when present; otherwise uses {@link ROLE_HOME}.
 */
export function getPostLoginRedirectPath(
  role: AppRole | null,
  options?: { next?: string | null }
): string {
  const rawNext = options?.next;
  if (rawNext && isSafeRelativePath(rawNext)) {
    return rawNext;
  }

  if (role !== null) {
    return ROLE_HOME[role];
  }

  return ROUTES.dashboard;
}
