import type { ApprovalLogWithActors } from "@/modules/approval-logs/types";

type Person = { full_name: string | null; email: string | null };

type ApprovalLogRow = Omit<
  ApprovalLogWithActors,
  | "actor_name"
  | "actor_email"
  | "from_name"
  | "from_email"
  | "to_name"
  | "to_email"
> & {
  actor: Person | Person[] | null;
  from_person: Person | Person[] | null;
  to_person: Person | Person[] | null;
};

function onePerson(value: Person | Person[] | null): Person | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export function mapApprovalLogRow(row: ApprovalLogRow): ApprovalLogWithActors {
  const actor = onePerson(row.actor);
  const fromP = onePerson(row.from_person);
  const toP = onePerson(row.to_person);
  return {
    id: row.id,
    organization_id: row.organization_id,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    action: row.action,
    from_user_id: row.from_user_id,
    to_user_id: row.to_user_id,
    acted_by_user_id: row.acted_by_user_id,
    note: row.note,
    created_at: row.created_at,
    actor_name: actor?.full_name ?? null,
    actor_email: actor?.email ?? null,
    from_name: fromP?.full_name ?? null,
    from_email: fromP?.email ?? null,
    to_name: toP?.full_name ?? null,
    to_email: toP?.email ?? null,
  };
}
