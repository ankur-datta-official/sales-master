import type { WorkReportStatus } from "@/constants/statuses";

export type WorkReport = {
  id: string;
  organization_id: string;
  owner_user_id: string;
  report_date: string;
  summary: string;
  achievements: string | null;
  challenges: string | null;
  next_step: string | null;
  status: WorkReportStatus;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkReportWithPeople = WorkReport & {
  owner_name: string | null;
  owner_email: string | null;
  reviewer_name: string | null;
  reviewer_email: string | null;
};
