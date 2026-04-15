import type { FactoryDispatchStatus } from "@/constants/statuses";

import type {
  DemandOrderDispatch,
  FactoryDispatchDetail,
  FactoryQueueListRow,
} from "@/modules/factory-dispatches/types";

type PersonShape = { full_name: string | null; email: string | null };

function pickPerson(value: PersonShape | PersonShape[] | null | undefined): PersonShape | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function pickParty(
  value: { name: string | null; code: string | null } | { name: string | null; code: string | null }[] | null
): { name: string | null; code: string | null } | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function firstDispatchEmbed(
  value:
    | Record<string, unknown>
    | Record<string, unknown>[]
    | null
    | undefined
): Record<string, unknown> | null {
  if (!value) return null;
  if (Array.isArray(value)) return (value[0] as Record<string, unknown>) ?? null;
  return value as Record<string, unknown>;
}

function toNumber(value: string | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function mapDispatchRow(row: Record<string, unknown>): DemandOrderDispatch {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    demand_order_id: String(row.demand_order_id),
    factory_status: row.factory_status as FactoryDispatchStatus,
    challan_no: row.challan_no != null ? String(row.challan_no) : null,
    memo_no: row.memo_no != null ? String(row.memo_no) : null,
    dispatch_date: row.dispatch_date != null ? String(row.dispatch_date) : null,
    remarks: String(row.remarks ?? ""),
    updated_by: row.updated_by != null ? String(row.updated_by) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

type ListOrderRow = {
  id: string;
  order_date: string;
  status: string;
  stage: string;
  total_amount: string | number;
  party_id: string;
  created_by_user_id: string;
  party: Parameters<typeof pickParty>[0];
  creator: Parameters<typeof pickPerson>[0];
  demand_order_dispatches: Parameters<typeof firstDispatchEmbed>[0];
};

export function mapFactoryQueueListRow(row: ListOrderRow): FactoryQueueListRow {
  const party = pickParty(row.party);
  const creator = pickPerson(row.creator);
  const dispRaw = firstDispatchEmbed(row.demand_order_dispatches);
  return {
    order_id: row.id,
    order_date: row.order_date,
    order_status: row.status,
    order_stage: row.stage,
    total_amount: toNumber(row.total_amount),
    party_name: party?.name ?? null,
    party_code: party?.code ?? null,
    creator_name: creator?.full_name ?? null,
    creator_email: creator?.email ?? null,
    dispatch: dispRaw ? mapDispatchRow(dispRaw) : null,
  };
}

type OrderEmbed = {
  order_date: string;
  status: string;
  stage: string;
  party_id: string;
  created_by_user_id: string;
  total_amount: string | number;
  remarks: string;
  party: Parameters<typeof pickParty>[0];
  creator: Parameters<typeof pickPerson>[0];
};

function firstEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return value;
}

export function mapFactoryDispatchDetailRow(row: Record<string, unknown>): FactoryDispatchDetail {
  const o = firstEmbed<OrderEmbed>(row.demand_order as OrderEmbed | OrderEmbed[] | null);
  if (!o) {
    throw new Error("Factory dispatch row missing demand_order embed");
  }
  const party = pickParty(o.party);
  const creator = pickPerson(o.creator);
  const updater = pickPerson(row.updater as Parameters<typeof pickPerson>[0]);
  const base = mapDispatchRow(row);
  return {
    ...base,
    order_date: o.order_date,
    order_status: String(o.status),
    order_stage: String(o.stage),
    party_id: String(o.party_id),
    party_name: party?.name ?? null,
    party_code: party?.code ?? null,
    created_by_user_id: String(o.created_by_user_id),
    creator_name: creator?.full_name ?? null,
    creator_email: creator?.email ?? null,
    order_total_amount: toNumber(o.total_amount),
    order_remarks: String(o.remarks ?? ""),
    updater_name: updater?.full_name ?? null,
    updater_email: updater?.email ?? null,
  };
}
