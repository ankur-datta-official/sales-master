import type { ApprovalLogAction, ApprovalLogEntityType } from "@/constants/statuses";

export type ApprovalLog = {
  id: string;
  organization_id: string;
  entity_type: ApprovalLogEntityType;
  entity_id: string;
  action: ApprovalLogAction;
  from_user_id: string | null;
  to_user_id: string | null;
  acted_by_user_id: string;
  note: string;
  created_at: string;
};

export type ApprovalLogWithActors = ApprovalLog & {
  actor_name: string | null;
  actor_email: string | null;
  from_name: string | null;
  from_email: string | null;
  to_name: string | null;
  to_email: string | null;
};
