import type { PartyStatus } from "@/constants/statuses";
import type { PartyWithAssignee } from "@/modules/parties/types";

type AssigneeShape = { full_name: string | null; email: string | null };

type PartyRow = {
  id: string;
  organization_id: string;
  assigned_to_user_id: string | null;
  name: string;
  code: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: PartyStatus;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  assignee: AssigneeShape | AssigneeShape[] | null;
};

function normalizeAssignee(value: PartyRow["assignee"]): AssigneeShape | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value;
}

export function mapPartyRow(row: PartyRow): PartyWithAssignee {
  const assignee = normalizeAssignee(row.assignee);
  return {
    id: row.id,
    organization_id: row.organization_id,
    assigned_to_user_id: row.assigned_to_user_id,
    name: row.name,
    code: row.code,
    contact_person: row.contact_person,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
    status: row.status,
    created_by_user_id: row.created_by_user_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    assignee_name: assignee?.full_name ?? null,
    assignee_email: assignee?.email ?? null,
  };
}
