import type { SalesTargetPeriodType, SalesTargetStatus } from "@/constants/statuses";

export type SalesTarget = {
  id: string;
  organization_id: string;
  assigned_to_user_id: string;
  party_id: string | null;
  period_type: SalesTargetPeriodType;
  start_date: string;
  end_date: string;
  target_amount: number;
  target_qty: number | null;
  status: SalesTargetStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type SalesTargetWithRelations = SalesTarget & {
  assignee_name: string | null;
  assignee_email: string | null;
  creator_name: string | null;
  creator_email: string | null;
  party_name: string | null;
  party_code: string | null;
};
