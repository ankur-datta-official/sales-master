"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";

import { ROUTES } from "@/config/routes";
import { resolveAppRole } from "@/lib/auth/app-role";
import { requireUserProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import {
  crmCompanySchema,
  crmContactSchema,
  crmDocumentSchema,
  crmFollowupSchema,
  crmHelpRequestSchema,
  crmInteractionSchema,
} from "@/modules/crm/schemas";

type CrmTable =
  | "crm_companies"
  | "crm_contacts"
  | "crm_interactions"
  | "crm_followups"
  | "crm_documents"
  | "crm_help_requests";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readOptional(formData: FormData, key: string) {
  const value = readString(formData, key).trim();
  return value || null;
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function validationError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

async function getActionContext() {
  const supabase = await createClient();
  const { user, profile } = await requireUserProfile();
  const role = resolveAppRole(user, profile);

  const organizationId = profile?.organization_id;
  if (!organizationId) {
    throw new Error("Your profile is missing an organization.");
  }

  if (!role || !["admin", "hos", "manager", "assistant_manager", "marketer"].includes(role)) {
    throw new Error("You do not have permission to manage CRM records.");
  }

  return { supabase, user, profile, organizationId };
}

async function ensureOrgRecord(table: CrmTable, id: string, organizationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from(table)
    .select("id, organization_id")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!data) {
    throw new Error("Selected CRM record is not available in your organization.");
  }
}

async function ensureOptionalOrgRecord(
  table: CrmTable,
  id: string | null,
  organizationId: string
) {
  if (id) await ensureOrgRecord(table, id, organizationId);
}

async function ensureOptionalProfile(id: string | null, organizationId: string) {
  if (!id) return;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, organization_id")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!data) {
    throw new Error("Selected team member is not available in your organization.");
  }
}

export async function createCrmCompanyAction(formData: FormData) {
  const parsed = crmCompanySchema.safeParse({
    name: readString(formData, "name"),
    lead_source: readOptional(formData, "lead_source"),
    priority: readString(formData, "priority") || "medium",
    assigned_to_user_id: readOptional(formData, "assigned_to_user_id"),
    pipeline_stage_id: readOptional(formData, "pipeline_stage_id"),
    lead_temperature: readString(formData, "lead_temperature") || "warm",
    status: readString(formData, "status") || "active",
    phone: readOptional(formData, "phone"),
    email: readOptional(formData, "email"),
    website: readOptional(formData, "website"),
    address: readOptional(formData, "address"),
    city: readOptional(formData, "city"),
    country: readOptional(formData, "country"),
    estimated_value: readOptional(formData, "estimated_value"),
    expected_closing_date: readOptional(formData, "expected_closing_date"),
    notes: readOptional(formData, "notes"),
  });

  if (!parsed.success) throw new Error(validationError(parsed.error));

  const { supabase, profile, organizationId } = await getActionContext();
  await ensureOptionalProfile(parsed.data.assigned_to_user_id, organizationId);

  const { error } = await supabase.from("crm_companies").insert({
    ...parsed.data,
    organization_id: organizationId,
    created_by_user_id: profile.id,
    updated_by_user_id: profile.id,
  });

  if (error) throw new Error("Could not create CRM company.");
  revalidatePath(ROUTES.crmCompanies);
  redirect(ROUTES.crmCompanies);
}

export async function createCrmContactAction(formData: FormData) {
  const parsed = crmContactSchema.safeParse({
    company_id: readString(formData, "company_id"),
    name: readString(formData, "name"),
    designation: readOptional(formData, "designation"),
    department: readOptional(formData, "department"),
    mobile: readOptional(formData, "mobile"),
    whatsapp: readOptional(formData, "whatsapp"),
    email: readOptional(formData, "email"),
    decision_role: readOptional(formData, "decision_role"),
    relationship_level: readOptional(formData, "relationship_level"),
    preferred_contact_method: readOptional(formData, "preferred_contact_method"),
    remarks: readOptional(formData, "remarks"),
    is_primary: readBoolean(formData, "is_primary"),
    status: readString(formData, "status") || "active",
  });

  if (!parsed.success) throw new Error(validationError(parsed.error));

  const { supabase, profile, organizationId } = await getActionContext();
  await ensureOrgRecord("crm_companies", parsed.data.company_id, organizationId);

  const { error } = await supabase.from("crm_contacts").insert({
    ...parsed.data,
    organization_id: organizationId,
    created_by_user_id: profile.id,
    updated_by_user_id: profile.id,
  });

  if (error) throw new Error("Could not create CRM contact.");
  revalidatePath(ROUTES.crmContacts);
  redirect(ROUTES.crmContacts);
}

export async function createCrmInteractionAction(formData: FormData) {
  const parsed = crmInteractionSchema.safeParse({
    company_id: readString(formData, "company_id"),
    contact_id: readOptional(formData, "contact_id"),
    assigned_to_user_id: readOptional(formData, "assigned_to_user_id"),
    interaction_type: readString(formData, "interaction_type") || "Phone Call",
    meeting_at: readString(formData, "meeting_at"),
    location: readOptional(formData, "location"),
    online_meeting_link: readOptional(formData, "online_meeting_link"),
    discussion_details: readString(formData, "discussion_details"),
    next_action: readOptional(formData, "next_action"),
    next_followup_at: readOptional(formData, "next_followup_at"),
    need_help: readBoolean(formData, "need_help"),
    status: readString(formData, "status") || "active",
  });

  if (!parsed.success) throw new Error(validationError(parsed.error));

  const { supabase, profile, organizationId } = await getActionContext();
  await ensureOrgRecord("crm_companies", parsed.data.company_id, organizationId);
  await ensureOptionalOrgRecord("crm_contacts", parsed.data.contact_id, organizationId);
  await ensureOptionalProfile(parsed.data.assigned_to_user_id, organizationId);

  const { error } = await supabase.from("crm_interactions").insert({
    ...parsed.data,
    organization_id: organizationId,
    created_by_user_id: profile.id,
    updated_by_user_id: profile.id,
  });

  if (error) throw new Error("Could not create CRM meeting.");
  revalidatePath(ROUTES.crmMeetings);
  redirect(ROUTES.crmMeetings);
}

export async function createCrmFollowupAction(formData: FormData) {
  const parsed = crmFollowupSchema.safeParse({
    company_id: readString(formData, "company_id"),
    contact_id: readOptional(formData, "contact_id"),
    interaction_id: readOptional(formData, "interaction_id"),
    assigned_to_user_id: readOptional(formData, "assigned_to_user_id"),
    followup_type: readString(formData, "followup_type") || "Phone Call",
    title: readString(formData, "title"),
    description: readOptional(formData, "description"),
    scheduled_at: readString(formData, "scheduled_at"),
    priority: readString(formData, "priority") || "medium",
    status: readString(formData, "status") || "pending",
  });

  if (!parsed.success) throw new Error(validationError(parsed.error));

  const { supabase, profile, organizationId } = await getActionContext();
  await ensureOrgRecord("crm_companies", parsed.data.company_id, organizationId);
  await ensureOptionalOrgRecord("crm_contacts", parsed.data.contact_id, organizationId);
  await ensureOptionalOrgRecord("crm_interactions", parsed.data.interaction_id, organizationId);
  await ensureOptionalProfile(parsed.data.assigned_to_user_id, organizationId);

  const { error } = await supabase.from("crm_followups").insert({
    ...parsed.data,
    organization_id: organizationId,
    created_by_user_id: profile.id,
    updated_by_user_id: profile.id,
  });

  if (error) throw new Error("Could not create CRM follow-up.");
  revalidatePath(ROUTES.crmFollowups);
  redirect(ROUTES.crmFollowups);
}

export async function createCrmDocumentAction(formData: FormData) {
  const parsed = crmDocumentSchema.safeParse({
    company_id: readString(formData, "company_id"),
    document_type: readString(formData, "document_type") || "Other",
    title: readString(formData, "title"),
    description: readOptional(formData, "description"),
    file_name: readOptional(formData, "file_name"),
    file_url: readOptional(formData, "file_url"),
    status: readString(formData, "status") || "draft",
    remarks: readOptional(formData, "remarks"),
  });

  if (!parsed.success) throw new Error(validationError(parsed.error));

  const { supabase, profile, organizationId } = await getActionContext();
  await ensureOrgRecord("crm_companies", parsed.data.company_id, organizationId);

  const { error } = await supabase.from("crm_documents").insert({
    ...parsed.data,
    organization_id: organizationId,
    created_by_user_id: profile.id,
    updated_by_user_id: profile.id,
  });

  if (error) throw new Error("Could not create CRM document.");
  revalidatePath(ROUTES.crmDocuments);
  redirect(ROUTES.crmDocuments);
}

export async function createCrmHelpRequestAction(formData: FormData) {
  const parsed = crmHelpRequestSchema.safeParse({
    company_id: readString(formData, "company_id"),
    assigned_to_user_id: readOptional(formData, "assigned_to_user_id"),
    help_type: readString(formData, "help_type") || "General Support",
    title: readString(formData, "title"),
    description: readOptional(formData, "description"),
    priority: readString(formData, "priority") || "medium",
    status: readString(formData, "status") || "open",
  });

  if (!parsed.success) throw new Error(validationError(parsed.error));

  const { supabase, profile, organizationId } = await getActionContext();
  await ensureOrgRecord("crm_companies", parsed.data.company_id, organizationId);
  await ensureOptionalProfile(parsed.data.assigned_to_user_id, organizationId);

  const { error } = await supabase.from("crm_help_requests").insert({
    ...parsed.data,
    organization_id: organizationId,
    requested_by_user_id: profile.id,
    created_by_user_id: profile.id,
    updated_by_user_id: profile.id,
  });

  if (error) throw new Error("Could not create CRM help request.");
  revalidatePath(ROUTES.crmHelp);
  redirect(ROUTES.crmHelp);
}
