import type { CollectionEntryWithRelations } from "@/modules/collection-entries/types";

type PersonShape = { full_name: string | null; email: string | null };

type CollectionEntryRow = Omit<
  CollectionEntryWithRelations,
  | "party_name"
  | "party_code"
  | "collector_name"
  | "collector_email"
  | "creator_name"
  | "creator_email"
  | "amount"
> & {
  amount: string | number;
  party: { name: string | null; code: string | null } | { name: string | null; code: string | null }[] | null;
  collector: PersonShape | PersonShape[] | null;
  creator: PersonShape | PersonShape[] | null;
};

function normalizePerson(value: PersonShape | PersonShape[] | null): PersonShape | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function normalizeParty(
  value: CollectionEntryRow["party"]
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

export function mapCollectionEntryRow(row: CollectionEntryRow): CollectionEntryWithRelations {
  const party = normalizeParty(row.party);
  const collector = normalizePerson(row.collector);
  const creator = normalizePerson(row.creator);
  return {
    id: row.id,
    organization_id: row.organization_id,
    user_id: row.user_id,
    party_id: row.party_id,
    entry_date: row.entry_date,
    amount: toNumber(row.amount),
    remarks: row.remarks,
    verification_status: row.verification_status,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    party_name: party?.name ?? null,
    party_code: party?.code ?? null,
    collector_name: collector?.full_name ?? null,
    collector_email: collector?.email ?? null,
    creator_name: creator?.full_name ?? null,
    creator_email: creator?.email ?? null,
  };
}
