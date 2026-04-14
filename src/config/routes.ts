/**
 * Central route prefixes for middleware and navigation guards.
 */
export const ROUTES = {
  login: "/login",
  dashboard: "/dashboard",
  profile: "/profile",
  users: "/users",
  usersNew: "/users/new",
  parties: "/parties",
  partiesNew: "/parties/new",
  products: "/products",
  productsNew: "/products/new",
  workPlans: "/work-plans",
  workPlansNew: "/work-plans/new",
  workReports: "/work-reports",
  workReportsNew: "/work-reports/new",
  authCallback: "/auth/callback",
} as const;

/** Paths that require an authenticated session */
export const PROTECTED_PATH_PREFIXES = [
  ROUTES.dashboard,
  ROUTES.profile,
  ROUTES.users,
  ROUTES.parties,
  ROUTES.products,
  ROUTES.workPlans,
  ROUTES.workReports,
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
