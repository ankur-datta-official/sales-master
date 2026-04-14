import type { WorkPlanWithPeople } from "@/modules/work-plans/types";

type PersonShape = { full_name: string | null; email: string | null };

type WorkPlanRow = Omit<WorkPlanWithPeople, "owner_name" | "owner_email" | "reviewer_name" | "reviewer_email"> & {
  owner: PersonShape | PersonShape[] | null;
  reviewer: PersonShape | PersonShape[] | null;
};

function normalizePerson(value: PersonShape | PersonShape[] | null): PersonShape | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export function mapWorkPlanRow(row: WorkPlanRow): WorkPlanWithPeople {
  const owner = normalizePerson(row.owner);
  const reviewer = normalizePerson(row.reviewer);
  return {
    id: row.id,
    organization_id: row.organization_id,
    owner_user_id: row.owner_user_id,
    plan_date: row.plan_date,
    title: row.title,
    details: row.details,
    priority: row.priority,
    status: row.status,
    submitted_at: row.submitted_at,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    review_note: row.review_note,
    created_at: row.created_at,
    updated_at: row.updated_at,
    owner_name: owner?.full_name ?? null,
    owner_email: owner?.email ?? null,
    reviewer_name: reviewer?.full_name ?? null,
    reviewer_email: reviewer?.email ?? null,
  };
}
