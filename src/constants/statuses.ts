/**
 * Cross-cutting status values (e.g. user lifecycle, sync jobs).
 * Keep domain-specific statuses next to their modules later.
 */
export const USER_STATUSES = ["active", "invited", "disabled"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const RECORD_STATUSES = ["draft", "published", "archived"] as const;

export type RecordStatus = (typeof RECORD_STATUSES)[number];

/** Matches `public.profiles.status` check constraint */
export const PROFILE_LIFECYCLE_STATUSES = [
  "invited",
  "active",
  "inactive",
  "suspended",
] as const;

export type ProfileLifecycleStatus = (typeof PROFILE_LIFECYCLE_STATUSES)[number];

/** Matches `public.parties.status` check constraint */
export const PARTY_STATUSES = ["active", "inactive"] as const;

export type PartyStatus = (typeof PARTY_STATUSES)[number];

/** Matches `public.products.status` check constraint */
export const PRODUCT_STATUSES = ["active", "inactive"] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** Matches `public.work_plans.status` check constraint */
export const WORK_PLAN_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "rejected",
] as const;

export type WorkPlanStatus = (typeof WORK_PLAN_STATUSES)[number];

export const WORK_PLAN_PRIORITIES = ["low", "medium", "high"] as const;

export type WorkPlanPriority = (typeof WORK_PLAN_PRIORITIES)[number];

/** Matches `public.work_reports.status` check constraint */
export const WORK_REPORT_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "rejected",
] as const;

export type WorkReportStatus = (typeof WORK_REPORT_STATUSES)[number];
