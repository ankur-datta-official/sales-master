/**
 * Cross-cutting status values (e.g. user lifecycle, sync jobs).
 * Keep domain-specific statuses next to their modules later.
 */
export const USER_STATUSES = ["active", "invited", "disabled"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const RECORD_STATUSES = ["draft", "published", "archived"] as const;

export type RecordStatus = (typeof RECORD_STATUSES)[number];
