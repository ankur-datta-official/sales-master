import type { AppRole } from "@/constants/roles";

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
