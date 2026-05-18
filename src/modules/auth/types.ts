export const SIGNUP_MODES = [
  "create_workspace",
  "join_workspace",
] as const;

export type SignupMode = (typeof SIGNUP_MODES)[number];

export const JOIN_REQUEST_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
] as const;

export type JoinRequestStatus = (typeof JOIN_REQUEST_STATUSES)[number];

export const AUTH_ACCESS_STATES = [
  "unauthenticated",
  "active",
  "pending",
  "blocked",
] as const;

export type AuthAccessState = (typeof AUTH_ACCESS_STATES)[number];

export type OrganizationJoinRequest = {
  id: string;
  organization_id: string;
  organization_name: string | null;
  organization_slug: string | null;
  user_id: string;
  email: string;
  full_name: string;
  requested_role_id: string | null;
  requested_branch_id: string | null;
  note: string | null;
  status: JoinRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthAccessReason =
  | "no_session"
  | "no_assignment"
  | "pending_request"
  | "rejected_request"
  | "inactive_profile"
  | "suspended_profile";

