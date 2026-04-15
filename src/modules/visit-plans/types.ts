import type { VisitPlanStatus } from "@/constants/statuses";

export type VisitPlan = {
  id: string;
  organization_id: string;
  party_id: string;
  user_id: string;
  visit_date: string;
  purpose: string;
  status: VisitPlanStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type VisitPlanWithRelations = VisitPlan & {
  party_name: string | null;
  party_code: string | null;
  assignee_name: string | null;
  assignee_email: string | null;
  creator_name: string | null;
  creator_email: string | null;
};
