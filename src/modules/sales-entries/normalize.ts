import type { SalesEntryWithRelations } from "@/modules/sales-entries/types";

type PersonShape = { full_name: string | null; email: string | null };

type SalesEntryRow = Omit<
  SalesEntryWithRelations,
  | "party_name"
  | "party_code"
  | "seller_name"
  | "seller_email"
  | "creator_name"
  | "creator_email"
  | "amount"
  | "quantity"
> & {
  amount: string | number;
  quantity: string | number;
  party: { name: string | null; code: string | null } | { name: string | null; code: string | null }[] | null;
  seller: PersonShape | PersonShape[] | null;
  creator: PersonShape | PersonShape[] | null;
};

function normalizePerson(value: PersonShape | PersonShape[] | null): PersonShape | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function normalizeParty(
  value: SalesEntryRow["party"]
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

export function mapSalesEntryRow(row: SalesEntryRow): SalesEntryWithRelations {
  const party = normalizeParty(row.party);
  const seller = normalizePerson(row.seller);
  const creator = normalizePerson(row.creator);
  return {
    id: row.id,
    organization_id: row.organization_id,
    user_id: row.user_id,
    party_id: row.party_id,
    entry_date: row.entry_date,
    amount: toNumber(row.amount),
    quantity: toNumber(row.quantity),
    remarks: row.remarks,
    source: row.source,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    party_name: party?.name ?? null,
    party_code: party?.code ?? null,
    seller_name: seller?.full_name ?? null,
    seller_email: seller?.email ?? null,
    creator_name: creator?.full_name ?? null,
    creator_email: creator?.email ?? null,
  };
}
