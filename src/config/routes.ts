/**
 * Central route prefixes for middleware and navigation guards.
 */
export const ROUTES = {
  login: "/login",
  dashboard: "/dashboard",
  profile: "/profile",
  authCallback: "/auth/callback",
} as const;

/** Paths that require an authenticated session */
export const PROTECTED_PATH_PREFIXES = [ROUTES.dashboard, ROUTES.profile] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
