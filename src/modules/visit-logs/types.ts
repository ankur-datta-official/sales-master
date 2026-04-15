import type { VisitLogStatus } from "@/constants/statuses";

export type VisitLog = {
  id: string;
  organization_id: string;
  party_id: string;
  user_id: string;
  visit_plan_id: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_out_lat: number | null;
  check_out_lng: number | null;
  notes: string;
  outcome: string;
  status: VisitLogStatus;
  created_at: string;
  updated_at: string;
};

export type VisitLogWithRelations = VisitLog & {
  party_name: string | null;
  party_code: string | null;
  assignee_name: string | null;
  assignee_email: string | null;
  visit_plan_visit_date: string | null;
  visit_plan_purpose: string | null;
};

export type VisitPlanLinkOption = {
  id: string;
  party_id: string;
  user_id: string;
  visit_date: string;
  purpose: string;
};
