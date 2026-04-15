import type { DemandOrderStage, DemandOrderStatus } from "@/constants/statuses";

export type DemandOrder = {
  id: string;
  organization_id: string;
  party_id: string;
  created_by_user_id: string;
  order_date: string;
  status: DemandOrderStatus;
  stage: DemandOrderStage;
  total_amount: number;
  remarks: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DemandOrderWithRelations = DemandOrder & {
  party_name: string | null;
  party_code: string | null;
  creator_name: string | null;
  creator_email: string | null;
};

export type DemandOrderItem = {
  id: string;
  demand_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  remark: string;
};

export type DemandOrderItemWithProduct = DemandOrderItem & {
  product_name: string | null;
  product_item_code: string | null;
};

export type DemandOrderDetail = DemandOrderWithRelations & {
  items: DemandOrderItemWithProduct[];
};
