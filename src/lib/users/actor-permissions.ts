import type { AppRole } from "@/constants/roles";
import { APP_ROLES } from "@/constants/roles";

/** Organization-scoped admin — full user management */
export function isOrgAdminRole(role: AppRole | null | undefined): boolean {
  return role === "admin";
}

export function canMutateOrgUsers(role: AppRole | null | undefined): boolean {
  return isOrgAdminRole(role);
}

export function canMutateParties(role: AppRole | null | undefined): boolean {
  return isOrgAdminRole(role);
}

export function canMutateProducts(role: AppRole | null | undefined): boolean {
  return isOrgAdminRole(role);
}

export function canCreateWorkPlans(role: AppRole | null | undefined): boolean {
  return role === "marketer" || isOrgAdminRole(role);
}

export function canReviewWorkPlans(role: AppRole | null | undefined): boolean {
  return (
    role === "assistant_manager" ||
    role === "manager" ||
    role === "hos" ||
    isOrgAdminRole(role)
  );
}

export function canCreateWorkReports(role: AppRole | null | undefined): boolean {
  return role === "marketer" || isOrgAdminRole(role);
}

export function canReviewWorkReports(role: AppRole | null | undefined): boolean {
  return (
    role === "assistant_manager" ||
    role === "manager" ||
    role === "hos" ||
    isOrgAdminRole(role)
  );
}

export function canCreateVisitPlans(role: AppRole | null | undefined): boolean {
  return role === "marketer" || isOrgAdminRole(role);
}

export function canCreateVisitLogs(role: AppRole | null | undefined): boolean {
  return role === "marketer" || isOrgAdminRole(role);
}

/** Create, update, and assign sales targets (not available to marketers / assistant managers). */
export function canManageSalesTargets(role: AppRole | null | undefined): boolean {
  return role === "manager" || role === "hos" || isOrgAdminRole(role);
}

/** Create, update, and assign collection targets (manager, HOS, admin only). */
export function canManageCollectionTargets(role: AppRole | null | undefined): boolean {
  return role === "manager" || role === "hos" || isOrgAdminRole(role);
}

export function canCreateSalesEntries(role: AppRole | null | undefined): boolean {
  return role === "marketer" || isOrgAdminRole(role);
}

export function canCreateCollectionEntries(role: AppRole | null | undefined): boolean {
  return role === "marketer" || isOrgAdminRole(role);
}

export function canVerifyCollectionEntries(role: AppRole | null | undefined): boolean {
  return role === "accounts" || isOrgAdminRole(role);
}

export function canCreateDemandOrders(role: AppRole | null | undefined): boolean {
  return role === "marketer" || isOrgAdminRole(role);
}

/** Review / forward demand orders (not available to marketers). */
export function canReviewDemandOrders(role: AppRole | null | undefined): boolean {
  return (
    role === "assistant_manager" ||
    role === "manager" ||
    role === "hos" ||
    isOrgAdminRole(role)
  );
}

export function canPerformAccountsDemandOrderReview(
  role: AppRole | null | undefined
): boolean {
  return role === "accounts" || isOrgAdminRole(role);
}

/** View factory queue and dispatch detail (read-only for accounts / hierarchy). */
export function canViewFactoryQueue(role: AppRole | null | undefined): boolean {
  return (
    role === "factory_operator" ||
    role === "accounts" ||
    role === "hos" ||
    role === "manager" ||
    role === "assistant_manager" ||
    isOrgAdminRole(role)
  );
}

/** Update dispatch records (challan, memo, dates, factory status). */
export function canUpdateFactoryDispatch(role: AppRole | null | undefined): boolean {
  return role === "factory_operator" || isOrgAdminRole(role);
}

/** Record check-in / check-out for the signed-in user (all org roles). */
export function canCheckInOutOwnAttendance(role: AppRole | null | undefined): boolean {
  return role != null && (APP_ROLES as readonly string[]).includes(role);
}

/** Filter team attendance history by user (managers / HOS / admin). */
export function canFilterAttendanceHistoryByUser(role: AppRole | null | undefined): boolean {
  return (
    role === "hos" ||
    role === "manager" ||
    role === "assistant_manager" ||
    isOrgAdminRole(role)
  );
}

/** Team field activity summary (active users + latest tracking) for hierarchy monitors. */
export function canViewFieldActivitySummary(role: AppRole | null | undefined): boolean {
  return (
    role === "hos" ||
    role === "manager" ||
    role === "assistant_manager" ||
    isOrgAdminRole(role)
  );
}

/** Lightweight analytics page is available to all known app roles. */
export function canViewAnalytics(role: AppRole | null | undefined): boolean {
  return role != null && (APP_ROLES as readonly string[]).includes(role);
}
