import type { FactoryDispatchStatus } from "@/constants/statuses";

export type DemandOrderDispatch = {
  id: string;
  organization_id: string;
  demand_order_id: string;
  factory_status: FactoryDispatchStatus;
  challan_no: string | null;
  memo_no: string | null;
  dispatch_date: string | null;
  remarks: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

/** One row in the factory queue list (order + optional dispatch record). */
export type FactoryQueueListRow = {
  order_id: string;
  order_date: string;
  order_status: string;
  order_stage: string;
  total_amount: number;
  party_name: string | null;
  party_code: string | null;
  creator_name: string | null;
  creator_email: string | null;
  dispatch: DemandOrderDispatch | null;
};

export type FactoryDispatchDetail = DemandOrderDispatch & {
  order_date: string;
  order_status: string;
  order_stage: string;
  party_id: string;
  party_name: string | null;
  party_code: string | null;
  created_by_user_id: string;
  creator_name: string | null;
  creator_email: string | null;
  order_total_amount: number;
  order_remarks: string;
  updater_name: string | null;
  updater_email: string | null;
};
