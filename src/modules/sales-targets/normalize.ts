import type { SalesTargetWithRelations } from "@/modules/sales-targets/types";

type PersonShape = { full_name: string | null; email: string | null };

type SalesTargetRow = Omit<
  SalesTargetWithRelations,
  | "assignee_name"
  | "assignee_email"
  | "creator_name"
  | "creator_email"
  | "party_name"
  | "party_code"
  | "target_amount"
  | "target_qty"
> & {
  target_amount: string | number;
  target_qty: string | number | null;
  assignee: PersonShape | PersonShape[] | null;
  creator: PersonShape | PersonShape[] | null;
  party: { name: string | null; code: string | null } | { name: string | null; code: string | null }[] | null;
};

function normalizePerson(value: PersonShape | PersonShape[] | null): PersonShape | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function normalizeParty(
  value: SalesTargetRow["party"]
): { name: string | null; code: string | null } | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export function mapSalesTargetRow(row: SalesTargetRow): SalesTargetWithRelations {
  const assignee = normalizePerson(row.assignee);
  const creator = normalizePerson(row.creator);
  const party = normalizeParty(row.party);
  const amt = typeof row.target_amount === "number" ? row.target_amount : parseFloat(row.target_amount);
  const qty = toNumber(row.target_qty);
  return {
    id: row.id,
    organization_id: row.organization_id,
    assigned_to_user_id: row.assigned_to_user_id,
    party_id: row.party_id,
    period_type: row.period_type,
    start_date: row.start_date,
    end_date: row.end_date,
    target_amount: Number.isFinite(amt) ? amt : 0,
    target_qty: qty,
    status: row.status,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    assignee_name: assignee?.full_name ?? null,
    assignee_email: assignee?.email ?? null,
    creator_name: creator?.full_name ?? null,
    creator_email: creator?.email ?? null,
    party_name: party?.name ?? null,
    party_code: party?.code ?? null,
  };
}
