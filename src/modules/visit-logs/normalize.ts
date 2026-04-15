import type { VisitLogWithRelations } from "@/modules/visit-logs/types";

type PersonShape = { full_name: string | null; email: string | null };

type VisitLogRow = Omit<
  VisitLogWithRelations,
  | "party_name"
  | "party_code"
  | "assignee_name"
  | "assignee_email"
  | "visit_plan_visit_date"
  | "visit_plan_purpose"
> & {
  party: { name: string | null; code: string | null } | { name: string | null; code: string | null }[] | null;
  assignee: PersonShape | PersonShape[] | null;
  visit_plan:
    | { visit_date: string; purpose: string }
    | { visit_date: string; purpose: string }[]
    | null;
};

function normalizePerson(value: PersonShape | PersonShape[] | null): PersonShape | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function normalizeParty(
  value: VisitLogRow["party"]
): { name: string | null; code: string | null } | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function normalizeVisitPlan(
  value: VisitLogRow["visit_plan"]
): { visit_date: string; purpose: string } | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export function mapVisitLogRow(row: VisitLogRow): VisitLogWithRelations {
  const party = normalizeParty(row.party);
  const assignee = normalizePerson(row.assignee);
  const plan = normalizeVisitPlan(row.visit_plan);
  return {
    id: row.id,
    organization_id: row.organization_id,
    party_id: row.party_id,
    user_id: row.user_id,
    visit_plan_id: row.visit_plan_id,
    check_in_time: row.check_in_time,
    check_out_time: row.check_out_time,
    check_in_lat: row.check_in_lat,
    check_in_lng: row.check_in_lng,
    check_out_lat: row.check_out_lat,
    check_out_lng: row.check_out_lng,
    notes: row.notes,
    outcome: row.outcome,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    party_name: party?.name ?? null,
    party_code: party?.code ?? null,
    assignee_name: assignee?.full_name ?? null,
    assignee_email: assignee?.email ?? null,
    visit_plan_visit_date: plan?.visit_date ?? null,
    visit_plan_purpose: plan?.purpose ?? null,
  };
}
