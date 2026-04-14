import type { PartyStatus } from "@/constants/statuses";

export type Party = {
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
};

export type PartyWithAssignee = Party & {
  assignee_name: string | null;
  assignee_email: string | null;
};
