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
  visitPlans: "/visit-plans",
  visitPlansNew: "/visit-plans/new",
  visitLogs: "/visit-logs",
  visitLogsNew: "/visit-logs/new",
  salesTargets: "/sales-targets",
  salesTargetsNew: "/sales-targets/new",
  collectionTargets: "/collection-targets",
  collectionTargetsNew: "/collection-targets/new",
  salesEntries: "/sales-entries",
  salesEntriesNew: "/sales-entries/new",
  collectionEntries: "/collection-entries",
  collectionEntriesNew: "/collection-entries/new",
  demandOrders: "/demand-orders",
  demandOrdersNew: "/demand-orders/new",
  approvals: "/approvals",
  accountsReview: "/accounts-review",
  factoryQueue: "/factory-queue",
  attendance: "/attendance",
  attendanceHistory: "/attendance/history",
  fieldActivity: "/field-activity",
  analytics: "/analytics",
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
  ROUTES.visitPlans,
  ROUTES.visitLogs,
  ROUTES.salesTargets,
  ROUTES.collectionTargets,
  ROUTES.salesEntries,
  ROUTES.collectionEntries,
  ROUTES.demandOrders,
  ROUTES.approvals,
  ROUTES.accountsReview,
  ROUTES.factoryQueue,
  ROUTES.attendance,
  ROUTES.fieldActivity,
  ROUTES.analytics,
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
