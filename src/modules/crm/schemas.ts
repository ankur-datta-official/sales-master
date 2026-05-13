import { z } from "zod";

import {
  CRM_DOCUMENT_STATUSES,
  CRM_DOCUMENT_TYPES,
  CRM_FOLLOWUP_STATUSES,
  CRM_FOLLOWUP_TYPES,
  CRM_HELP_STATUSES,
  CRM_HELP_TYPES,
  CRM_INTERACTION_TYPES,
  CRM_LEAD_TEMPERATURES,
  CRM_PRIORITIES,
  CRM_RECORD_STATUSES,
} from "@/modules/crm/types";

const optionalText = z
  .preprocess((value) => (typeof value === "string" && value.trim() === "" ? null : value), z.string().nullable().optional())
  .transform((value) => (typeof value === "string" ? value.trim() : null));

const optionalUuid = z
  .preprocess((value) => (typeof value === "string" && value.trim() === "" ? null : value), z.string().uuid().nullable().optional())
  .transform((value) => value ?? null);

const optionalEmail = z
  .preprocess((value) => (typeof value === "string" && value.trim() === "" ? null : value), z.string().email().nullable().optional())
  .transform((value) => (typeof value === "string" ? value.trim().toLowerCase() : null));

const optionalUrl = z
  .preprocess((value) => (typeof value === "string" && value.trim() === "" ? null : value), z.string().url().nullable().optional())
  .transform((value) => (typeof value === "string" ? value.trim() : null));

const optionalDate = z
  .preprocess((value) => (typeof value === "string" && value.trim() === "" ? null : value), z.string().nullable().optional())
  .transform((value) => value ?? null);

const optionalNumber = z
  .preprocess((value) => {
    if (value === "" || value === null || value === undefined) return null;
    return Number(value);
  }, z.number().min(0).nullable().optional())
  .transform((value) => value ?? null);

export const crmCompanySchema = z.object({
  name: z.string().trim().min(2).max(200),
  lead_source: optionalText,
  priority: z.enum(CRM_PRIORITIES).default("medium"),
  assigned_to_user_id: optionalUuid,
  pipeline_stage_id: optionalUuid,
  lead_temperature: z.enum(CRM_LEAD_TEMPERATURES).default("warm"),
  status: z.enum(CRM_RECORD_STATUSES).default("active"),
  phone: optionalText,
  email: optionalEmail,
  website: optionalUrl,
  address: optionalText,
  city: optionalText,
  country: optionalText,
  estimated_value: optionalNumber,
  expected_closing_date: optionalDate,
  notes: optionalText,
});

export const crmContactSchema = z.object({
  company_id: z.string().uuid(),
  name: z.string().trim().min(2).max(200),
  designation: optionalText,
  department: optionalText,
  mobile: optionalText,
  whatsapp: optionalText,
  email: optionalEmail,
  decision_role: optionalText,
  relationship_level: optionalText,
  preferred_contact_method: optionalText,
  remarks: optionalText,
  is_primary: z.coerce.boolean().default(false),
  status: z.enum(CRM_RECORD_STATUSES).default("active"),
});

export const crmInteractionSchema = z.object({
  company_id: z.string().uuid(),
  contact_id: optionalUuid,
  assigned_to_user_id: optionalUuid,
  interaction_type: z.enum(CRM_INTERACTION_TYPES).default("Phone Call"),
  meeting_at: z.string().min(1),
  location: optionalText,
  online_meeting_link: optionalUrl,
  discussion_details: z.string().trim().min(2),
  next_action: optionalText,
  next_followup_at: optionalDate,
  need_help: z.coerce.boolean().default(false),
  status: z.enum(CRM_RECORD_STATUSES).default("active"),
});

export const crmFollowupSchema = z.object({
  company_id: z.string().uuid(),
  contact_id: optionalUuid,
  interaction_id: optionalUuid,
  assigned_to_user_id: optionalUuid,
  followup_type: z.enum(CRM_FOLLOWUP_TYPES).default("Phone Call"),
  title: z.string().trim().min(2).max(200),
  description: optionalText,
  scheduled_at: z.string().min(1),
  priority: z.enum(CRM_PRIORITIES).default("medium"),
  status: z.enum(CRM_FOLLOWUP_STATUSES).default("pending"),
});

export const crmDocumentSchema = z.object({
  company_id: z.string().uuid(),
  document_type: z.enum(CRM_DOCUMENT_TYPES).default("Other"),
  title: z.string().trim().min(2).max(200),
  description: optionalText,
  file_name: optionalText,
  file_url: optionalUrl,
  status: z.enum(CRM_DOCUMENT_STATUSES).default("draft"),
  remarks: optionalText,
});

export const crmHelpRequestSchema = z.object({
  company_id: z.string().uuid(),
  assigned_to_user_id: optionalUuid,
  help_type: z.enum(CRM_HELP_TYPES).default("General Support"),
  title: z.string().trim().min(2).max(200),
  description: optionalText,
  priority: z.enum(CRM_PRIORITIES).default("medium"),
  status: z.enum(CRM_HELP_STATUSES).default("open"),
});

export type CrmCompanyInput = z.infer<typeof crmCompanySchema>;
export type CrmContactInput = z.infer<typeof crmContactSchema>;
export type CrmInteractionInput = z.infer<typeof crmInteractionSchema>;
export type CrmFollowupInput = z.infer<typeof crmFollowupSchema>;
export type CrmDocumentInput = z.infer<typeof crmDocumentSchema>;
export type CrmHelpRequestInput = z.infer<typeof crmHelpRequestSchema>;
