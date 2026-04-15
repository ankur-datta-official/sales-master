import type { DemandOrderStage, DemandOrderStatus } from "@/constants/statuses";
import type {
  DemandOrderItemWithProduct,
  DemandOrderWithRelations,
} from "@/modules/demand-orders/types";

type PersonShape = { full_name: string | null; email: string | null };

type DemandOrderRow = Omit<
  DemandOrderWithRelations,
  | "party_name"
  | "party_code"
  | "creator_name"
  | "creator_email"
  | "total_amount"
> & {
  total_amount: string | number;
  party: { name: string | null; code: string | null } | { name: string | null; code: string | null }[] | null;
  creator: PersonShape | PersonShape[] | null;
};

function normalizePerson(value: PersonShape | PersonShape[] | null): PersonShape | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function normalizeParty(
  value: DemandOrderRow["party"]
): { name: string | null; code: string | null } | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function toNumber(value: string | number): number {
  if (typeof value === "number") return value;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function mapDemandOrderRow(row: DemandOrderRow): DemandOrderWithRelations {
  const party = normalizeParty(row.party);
  const creator = normalizePerson(row.creator);
  return {
    id: row.id,
    organization_id: row.organization_id,
    party_id: row.party_id,
    created_by_user_id: row.created_by_user_id,
    order_date: row.order_date,
    status: row.status as DemandOrderStatus,
    stage: row.stage as DemandOrderStage,
    total_amount: toNumber(row.total_amount),
    remarks: row.remarks,
    submitted_at: row.submitted_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    party_name: party?.name ?? null,
    party_code: party?.code ?? null,
    creator_name: creator?.full_name ?? null,
    creator_email: creator?.email ?? null,
  };
}

type DemandOrderItemRow = Omit<
  DemandOrderItemWithProduct,
  | "quantity"
  | "unit_price"
  | "line_total"
  | "product_name"
  | "product_item_code"
> & {
  quantity: string | number;
  unit_price: string | number;
  line_total: string | number;
  product:
    | { product_name: string | null; item_code: string | null }
    | { product_name: string | null; item_code: string | null }[]
    | null;
};

function normalizeProduct(
  value: DemandOrderItemRow["product"]
): { product_name: string | null; item_code: string | null } | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export function mapDemandOrderItemRow(row: DemandOrderItemRow): DemandOrderItemWithProduct {
  const product = normalizeProduct(row.product);
  return {
    id: row.id,
    demand_order_id: row.demand_order_id,
    product_id: row.product_id,
    quantity: toNumber(row.quantity),
    unit_price: toNumber(row.unit_price),
    line_total: toNumber(row.line_total),
    remark: row.remark,
    product_name: product?.product_name ?? null,
    product_item_code: product?.item_code ?? null,
  };
}
