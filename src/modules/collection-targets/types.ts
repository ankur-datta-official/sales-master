import type {
  CollectionTargetPeriodType,
  CollectionTargetStatus,
} from "@/constants/statuses";

export type CollectionTarget = {
  id: string;
  organization_id: string;
  assigned_to_user_id: string;
  party_id: string | null;
  period_type: CollectionTargetPeriodType;
  start_date: string;
  end_date: string;
  target_amount: number;
  status: CollectionTargetStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CollectionTargetWithRelations = CollectionTarget & {
  assignee_name: string | null;
  assignee_email: string | null;
  creator_name: string | null;
  creator_email: string | null;
  party_name: string | null;
  party_code: string | null;
};
