import { cache } from "react";

import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import type {
  CrmCompany,
  CrmContact,
  CrmDocument,
  CrmFollowup,
  CrmFormOptions,
  CrmHelpRequest,
  CrmInteraction,
  CrmListFilters,
  CrmPipelineStage,
  CrmProfileOption,
} from "@/modules/crm/types";

type CountResult<T> = {
  rows: T[];
  total: number;
};

const COMPANY_SELECT = `
  id, organization_id, name, lead_source, priority, assigned_to_user_id,
  pipeline_stage_id, lead_temperature, status, phone, email, website,
  address, city, country, estimated_value, expected_closing_date, notes,
  created_by_user_id, updated_at,
  pipeline_stage:crm_pipeline_stages(name, color, probability, is_won, is_lost),
  assignee:profiles!crm_companies_assigned_to_user_id_fkey(full_name, email)
`;

const CONTACT_SELECT = `
  id, organization_id, company_id, name, designation, department, mobile,
  whatsapp, email, decision_role, relationship_level, preferred_contact_method,
  remarks, is_primary, status,
  company:crm_companies(id, name, phone, email)
`;

const INTERACTION_SELECT = `
  id, organization_id, company_id, contact_id, assigned_to_user_id,
  interaction_type, meeting_at, location, online_meeting_link,
  discussion_details, next_action, next_followup_at, need_help, status,
  completed_at,
  company:crm_companies(id, name),
  contact:crm_contacts(id, name, mobile, email),
  assignee:profiles!crm_interactions_assigned_to_user_id_fkey(full_name, email)
`;

const FOLLOWUP_SELECT = `
  id, organization_id, company_id, contact_id, interaction_id, assigned_to_user_id,
  followup_type, title, description, scheduled_at, priority, status, completed_at,
  company:crm_companies(id, name),
  contact:crm_contacts(id, name, mobile, email),
  assignee:profiles!crm_followups_assigned_to_user_id_fkey(full_name, email)
`;

const DOCUMENT_SELECT = `
  id, organization_id, company_id, document_type, title, description,
  file_name, file_url, status, remarks, created_at,
  company:crm_companies(id, name)
`;

const HELP_SELECT = `
  id, organization_id, company_id, requested_by_user_id, assigned_to_user_id,
  help_type, title, description, priority, status, resolution_note, created_at,
  company:crm_companies(id, name),
  requester:profiles!crm_help_requests_requested_by_user_id_fkey(full_name, email),
  assignee:profiles!crm_help_requests_assigned_to_user_id_fkey(full_name, email)
`;

function cleanSearch(value?: string) {
  return value?.replace(/[%_]/g, "").trim() ?? "";
}

function normalizeCount(count: number | null) {
  return count ?? 0;
}

async function getOrgId() {
  const { profile } = await requireUserProfile();
  if (!profile?.organization_id) {
    throw new Error("Your profile is missing an organization.");
  }
  return profile.organization_id;
}

export const getCrmPipelineStages = cache(async (): Promise<CrmPipelineStage[]> => {
  const supabase = await createClient();
  const organizationId = await getOrgId();
  const { data, error } = await supabase
    .from("crm_pipeline_stages")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (error) throw new Error("Could not load CRM pipeline stages.");
  return (data ?? []) as CrmPipelineStage[];
});

export const getCrmTeamMembers = cache(async (): Promise<CrmProfileOption[]> => {
  const supabase = await createClient();
  const organizationId = await getOrgId();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("full_name", { ascending: true });

  if (error) throw new Error("Could not load team members.");
  return (data ?? []) as CrmProfileOption[];
});

export const getCrmCompaniesForOptions = cache(async () => {
  const supabase = await createClient();
  const organizationId = await getOrgId();
  const { data, error } = await supabase
    .from("crm_companies")
    .select("id, name")
    .eq("organization_id", organizationId)
    .neq("status", "archived")
    .order("name", { ascending: true });

  if (error) throw new Error("Could not load CRM companies.");
  return (data ?? []) as Array<Pick<CrmCompany, "id" | "name">>;
});

export const getCrmContactsForOptions = cache(async () => {
  const supabase = await createClient();
  const organizationId = await getOrgId();
  const { data, error } = await supabase
    .from("crm_contacts")
    .select("id, name, company_id")
    .eq("organization_id", organizationId)
    .neq("status", "archived")
    .order("name", { ascending: true });

  if (error) throw new Error("Could not load CRM contacts.");
  return (data ?? []) as Array<Pick<CrmContact, "id" | "name" | "company_id">>;
});

export async function getCrmFormOptions(): Promise<CrmFormOptions> {
  const [companies, contacts, teamMembers, pipelineStages] = await Promise.all([
    getCrmCompaniesForOptions(),
    getCrmContactsForOptions(),
    getCrmTeamMembers(),
    getCrmPipelineStages(),
  ]);

  return { companies, contacts, teamMembers, pipelineStages };
}

export async function getCrmCompanies(filters: CrmListFilters = {}): Promise<CountResult<CrmCompany>> {
  const supabase = await createClient();
  const q = cleanSearch(filters.q);
  let query = supabase
    .from("crm_companies")
    .select(COMPANY_SELECT, { count: "exact" })
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.priority) query = query.eq("priority", filters.priority);

  const { data, error, count } = await query;
  if (error) throw new Error("Could not load CRM companies.");
  return { rows: (data ?? []) as unknown as CrmCompany[], total: normalizeCount(count) };
}

export async function getCrmContacts(filters: CrmListFilters = {}): Promise<CountResult<CrmContact>> {
  const supabase = await createClient();
  const q = cleanSearch(filters.q);
  let query = supabase
    .from("crm_contacts")
    .select(CONTACT_SELECT, { count: "exact" })
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,mobile.ilike.%${q}%`);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error, count } = await query;
  if (error) throw new Error("Could not load CRM contacts.");
  return { rows: (data ?? []) as unknown as CrmContact[], total: normalizeCount(count) };
}

export async function getCrmInteractions(filters: CrmListFilters = {}): Promise<CountResult<CrmInteraction>> {
  const supabase = await createClient();
  const q = cleanSearch(filters.q);
  let query = supabase
    .from("crm_interactions")
    .select(INTERACTION_SELECT, { count: "exact" })
    .neq("status", "archived")
    .order("meeting_at", { ascending: false });

  if (q) query = query.or(`discussion_details.ilike.%${q}%,next_action.ilike.%${q}%`);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error, count } = await query;
  if (error) throw new Error("Could not load CRM meetings.");
  return { rows: (data ?? []) as unknown as CrmInteraction[], total: normalizeCount(count) };
}

export async function getCrmFollowups(filters: CrmListFilters = {}): Promise<CountResult<CrmFollowup>> {
  const supabase = await createClient();
  const q = cleanSearch(filters.q);
  let query = supabase
    .from("crm_followups")
    .select(FOLLOWUP_SELECT, { count: "exact" })
    .neq("status", "archived")
    .order("scheduled_at", { ascending: true });

  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.priority) query = query.eq("priority", filters.priority);

  const { data, error, count } = await query;
  if (error) throw new Error("Could not load CRM follow-ups.");
  return { rows: (data ?? []) as unknown as CrmFollowup[], total: normalizeCount(count) };
}

export async function getCrmDocuments(filters: CrmListFilters = {}): Promise<CountResult<CrmDocument>> {
  const supabase = await createClient();
  const q = cleanSearch(filters.q);
  let query = supabase
    .from("crm_documents")
    .select(DOCUMENT_SELECT, { count: "exact" })
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (q) query = query.or(`title.ilike.%${q}%,file_name.ilike.%${q}%`);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error, count } = await query;
  if (error) throw new Error("Could not load CRM documents.");
  return { rows: (data ?? []) as unknown as CrmDocument[], total: normalizeCount(count) };
}

export async function getCrmHelpRequests(filters: CrmListFilters = {}): Promise<CountResult<CrmHelpRequest>> {
  const supabase = await createClient();
  const q = cleanSearch(filters.q);
  let query = supabase
    .from("crm_help_requests")
    .select(HELP_SELECT, { count: "exact" })
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.priority) query = query.eq("priority", filters.priority);

  const { data, error, count } = await query;
  if (error) throw new Error("Could not load CRM help requests.");
  return { rows: (data ?? []) as unknown as CrmHelpRequest[], total: normalizeCount(count) };
}

export async function getCrmReportSummary() {
  const [companies, contacts, interactions, followups, helpRequests, stages] = await Promise.all([
    getCrmCompanies(),
    getCrmContacts(),
    getCrmInteractions(),
    getCrmFollowups(),
    getCrmHelpRequests(),
    getCrmPipelineStages(),
  ]);

  return {
    companies: companies.total,
    contacts: contacts.total,
    meetings: interactions.total,
    pendingFollowups: followups.rows.filter((item) => item.status === "pending").length,
    openHelpRequests: helpRequests.rows.filter((item) => item.status === "open").length,
    pipelineStages: stages,
    pipelineValue: companies.rows.reduce((total, company) => total + Number(company.estimated_value ?? 0), 0),
  };
}
