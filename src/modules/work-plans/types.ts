import type { WorkPlanPriority, WorkPlanStatus } from "@/constants/statuses";

export type WorkPlan = {
  id: string;
  organization_id: string;
  owner_user_id: string;
  plan_date: string;
  title: string;
  details: string;
  priority: WorkPlanPriority | null;
  status: WorkPlanStatus;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkPlanWithPeople = WorkPlan & {
  owner_name: string | null;
  owner_email: string | null;
  reviewer_name: string | null;
  reviewer_email: string | null;
};
