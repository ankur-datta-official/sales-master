import type { VisitPlanWithRelations } from "@/modules/visit-plans/types";

type PersonShape = { full_name: string | null; email: string | null };

type VisitPlanRow = Omit<
  VisitPlanWithRelations,
  | "party_name"
  | "party_code"
  | "assignee_name"
  | "assignee_email"
  | "creator_name"
  | "creator_email"
> & {
  party: { name: string | null; code: string | null } | { name: string | null; code: string | null }[] | null;
  assignee: PersonShape | PersonShape[] | null;
  creator: PersonShape | PersonShape[] | null;
};

function normalizePerson(value: PersonShape | PersonShape[] | null): PersonShape | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function normalizeParty(
  value: VisitPlanRow["party"]
): { name: string | null; code: string | null } | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export function mapVisitPlanRow(row: VisitPlanRow): VisitPlanWithRelations {
  const party = normalizeParty(row.party);
  const assignee = normalizePerson(row.assignee);
  const creator = normalizePerson(row.creator);
  return {
    id: row.id,
    organization_id: row.organization_id,
    party_id: row.party_id,
    user_id: row.user_id,
    visit_date: row.visit_date,
    purpose: row.purpose,
    status: row.status,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    party_name: party?.name ?? null,
    party_code: party?.code ?? null,
    assignee_name: assignee?.full_name ?? null,
    assignee_email: assignee?.email ?? null,
    creator_name: creator?.full_name ?? null,
    creator_email: creator?.email ?? null,
  };
}
