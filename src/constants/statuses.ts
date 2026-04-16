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

/** Matches `public.visit_plans.status` check constraint */
export const VISIT_PLAN_STATUSES = [
  "planned",
  "completed",
  "skipped",
  "cancelled",
] as const;

export type VisitPlanStatus = (typeof VISIT_PLAN_STATUSES)[number];

/** Matches `public.visit_logs.status` check constraint */
export const VISIT_LOG_STATUSES = ["completed", "partial", "cancelled"] as const;

export type VisitLogStatus = (typeof VISIT_LOG_STATUSES)[number];

/** Matches `public.sales_targets.status` check constraint */
export const SALES_TARGET_STATUSES = [
  "draft",
  "active",
  "completed",
  "cancelled",
] as const;

export type SalesTargetStatus = (typeof SALES_TARGET_STATUSES)[number];

/** Matches `public.sales_targets.period_type` check constraint */
export const SALES_TARGET_PERIOD_TYPES = ["daily", "weekly", "monthly"] as const;

export type SalesTargetPeriodType = (typeof SALES_TARGET_PERIOD_TYPES)[number];

/** Matches `public.collection_targets.status` check constraint */
export const COLLECTION_TARGET_STATUSES = [
  "draft",
  "active",
  "completed",
  "cancelled",
] as const;

export type CollectionTargetStatus = (typeof COLLECTION_TARGET_STATUSES)[number];

/** Matches `public.collection_targets.period_type` check constraint */
export const COLLECTION_TARGET_PERIOD_TYPES = ["daily", "weekly", "monthly"] as const;

export type CollectionTargetPeriodType = (typeof COLLECTION_TARGET_PERIOD_TYPES)[number];

/** Matches `public.sales_entries.source` check constraint (v1: manual only) */
export const SALES_ENTRY_SOURCES = ["manual"] as const;

export type SalesEntrySource = (typeof SALES_ENTRY_SOURCES)[number];

/** Matches `public.collection_entries.verification_status` check constraint */
export const COLLECTION_ENTRY_VERIFICATION_STATUSES = [
  "unverified",
  "verified",
  "rejected",
] as const;

export type CollectionEntryVerificationStatus =
  (typeof COLLECTION_ENTRY_VERIFICATION_STATUSES)[number];

/** Matches `public.demand_orders.status` check constraint */
export const DEMAND_ORDER_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "sent_to_factory",
] as const;

export type DemandOrderStatus = (typeof DEMAND_ORDER_STATUSES)[number];

export const DEMAND_ORDER_STATUS = {
  draft: "draft",
  submitted: "submitted",
  underReview: "under_review",
  approved: "approved",
  rejected: "rejected",
  sentToFactory: "sent_to_factory",
} as const satisfies Record<string, DemandOrderStatus>;

/** Matches `public.demand_orders.stage` check constraint */
export const DEMAND_ORDER_STAGES = [
  "draft",
  "manager_review",
  "accounts_review",
  "factory_queue",
] as const;

export type DemandOrderStage = (typeof DEMAND_ORDER_STAGES)[number];

export const DEMAND_ORDER_STAGE = {
  draft: "draft",
  managerReview: "manager_review",
  accountsReview: "accounts_review",
  factoryQueue: "factory_queue",
} as const satisfies Record<string, DemandOrderStage>;

/** Matches `public.approval_logs.action` check constraint (v1) */
export const APPROVAL_LOG_ACTIONS = [
  "submit",
  "approve",
  "reject",
  "forward",
  "accounts_approve",
  "accounts_reject",
] as const;

export type ApprovalLogAction = (typeof APPROVAL_LOG_ACTIONS)[number];

export const APPROVAL_LOG_ACTION = {
  submit: "submit",
  approve: "approve",
  reject: "reject",
  forward: "forward",
  accountsApprove: "accounts_approve",
  accountsReject: "accounts_reject",
} as const satisfies Record<string, ApprovalLogAction>;

/** Matches `public.approval_logs.entity_type` check constraint (v1) */
export const APPROVAL_LOG_ENTITY_TYPES = ["demand_order"] as const;

export type ApprovalLogEntityType = (typeof APPROVAL_LOG_ENTITY_TYPES)[number];

/** Matches `public.demand_order_dispatches.factory_status` */
export const FACTORY_DISPATCH_STATUSES = [
  "pending",
  "processing",
  "ready",
  "dispatched",
  "delivered",
] as const;

export type FactoryDispatchStatus = (typeof FACTORY_DISPATCH_STATUSES)[number];

/** Matches `public.attendance_sessions.status` */
export const ATTENDANCE_SESSION_STATUSES = [
  "checked_in",
  "checked_out",
  "missed_checkout",
] as const;

export type AttendanceSessionStatus = (typeof ATTENDANCE_SESSION_STATUSES)[number];

/** Matches `public.location_pings.source` check constraint */
export const LOCATION_PING_SOURCES = ["web", "mobile", "manual", "system"] as const;

export type LocationPingSource = (typeof LOCATION_PING_SOURCES)[number];
