export const CRM_RECORD_STATUSES = ["active", "inactive", "archived"] as const;
export const CRM_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const CRM_LEAD_TEMPERATURES = ["cold", "warm", "hot", "very_hot"] as const;
export const CRM_FOLLOWUP_STATUSES = [
  "pending",
  "completed",
  "rescheduled",
  "cancelled",
  "archived",
] as const;
export const CRM_HELP_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "rejected",
  "archived",
] as const;
export const CRM_DOCUMENT_STATUSES = [
  "draft",
  "submitted",
  "seen",
  "revision_requested",
  "approved",
  "rejected",
  "archived",
] as const;

export const CRM_INTERACTION_TYPES = [
  "Phone Call",
  "Physical Meeting",
  "Online Meeting",
  "WhatsApp Discussion",
  "Email Follow-up",
  "Demo Meeting",
  "Technical Meeting",
  "Quotation Discussion",
  "Payment Discussion",
  "Closing Meeting",
  "Other",
] as const;

export const CRM_FOLLOWUP_TYPES = [
  "Phone Call",
  "Email",
  "WhatsApp",
  "Physical Meeting",
  "Online Meeting",
  "Quotation Follow-up",
  "Payment Follow-up",
  "Technical Follow-up",
  "Demo Follow-up",
  "Decision Follow-up",
  "Other",
] as const;

export const CRM_HELP_TYPES = [
  "General Support",
  "Need Technical Support",
  "Need Price Approval",
  "Need Senior Meeting",
  "Need Product Demo",
  "Need Quotation Support",
  "Need Proposal Support",
  "Need Management Decision",
  "Need Site Visit",
  "Need Document Support",
  "Need Payment Follow-up",
  "Other",
] as const;

export const CRM_DOCUMENT_TYPES = [
  "Company Profile",
  "Brochure",
  "Quotation",
  "Technical Proposal",
  "Financial Proposal",
  "Agreement",
  "Presentation",
  "BOQ",
  "Meeting File",
  "Product Catalogue",
  "Invoice",
  "Purchase Order",
  "Other",
] as const;

export type CrmRecordStatus = (typeof CRM_RECORD_STATUSES)[number];
export type CrmPriority = (typeof CRM_PRIORITIES)[number];
export type CrmLeadTemperature = (typeof CRM_LEAD_TEMPERATURES)[number];
export type CrmFollowupStatus = (typeof CRM_FOLLOWUP_STATUSES)[number];
export type CrmHelpStatus = (typeof CRM_HELP_STATUSES)[number];
export type CrmDocumentStatus = (typeof CRM_DOCUMENT_STATUSES)[number];
export type CrmInteractionType = (typeof CRM_INTERACTION_TYPES)[number];
export type CrmFollowupType = (typeof CRM_FOLLOWUP_TYPES)[number];
export type CrmHelpType = (typeof CRM_HELP_TYPES)[number];
export type CrmDocumentType = (typeof CRM_DOCUMENT_TYPES)[number];

export type CrmProfileOption = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export type CrmPipelineStage = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  color: string;
  probability: number;
  position: number;
  is_won: boolean;
  is_lost: boolean;
  is_active: boolean;
};

export type CrmCompany = {
  id: string;
  organization_id: string;
  name: string;
  lead_source: string | null;
  priority: CrmPriority;
  assigned_to_user_id: string | null;
  pipeline_stage_id: string | null;
  lead_temperature: CrmLeadTemperature;
  status: CrmRecordStatus;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  estimated_value: number | null;
  expected_closing_date: string | null;
  notes: string | null;
  created_by_user_id: string | null;
  updated_at: string;
  pipeline_stage?: Pick<CrmPipelineStage, "name" | "color" | "probability" | "is_won" | "is_lost"> | null;
  assignee?: Pick<CrmProfileOption, "full_name" | "email"> | null;
};

export type CrmContact = {
  id: string;
  organization_id: string;
  company_id: string;
  name: string;
  designation: string | null;
  department: string | null;
  mobile: string | null;
  whatsapp: string | null;
  email: string | null;
  decision_role: string | null;
  relationship_level: string | null;
  preferred_contact_method: string | null;
  remarks: string | null;
  is_primary: boolean;
  status: CrmRecordStatus;
  company?: Pick<CrmCompany, "id" | "name" | "phone" | "email"> | null;
};

export type CrmInteraction = {
  id: string;
  organization_id: string;
  company_id: string;
  contact_id: string | null;
  assigned_to_user_id: string | null;
  interaction_type: CrmInteractionType;
  meeting_at: string;
  location: string | null;
  online_meeting_link: string | null;
  discussion_details: string;
  next_action: string | null;
  next_followup_at: string | null;
  need_help: boolean;
  status: CrmRecordStatus;
  completed_at: string | null;
  company?: Pick<CrmCompany, "id" | "name"> | null;
  contact?: Pick<CrmContact, "id" | "name" | "mobile" | "email"> | null;
  assignee?: Pick<CrmProfileOption, "full_name" | "email"> | null;
};

export type CrmFollowup = {
  id: string;
  organization_id: string;
  company_id: string;
  contact_id: string | null;
  interaction_id: string | null;
  assigned_to_user_id: string | null;
  followup_type: CrmFollowupType;
  title: string;
  description: string | null;
  scheduled_at: string;
  priority: CrmPriority;
  status: CrmFollowupStatus;
  completed_at: string | null;
  company?: Pick<CrmCompany, "id" | "name"> | null;
  contact?: Pick<CrmContact, "id" | "name" | "mobile" | "email"> | null;
  assignee?: Pick<CrmProfileOption, "full_name" | "email"> | null;
};

export type CrmDocument = {
  id: string;
  organization_id: string;
  company_id: string;
  document_type: CrmDocumentType;
  title: string;
  description: string | null;
  file_name: string | null;
  file_url: string | null;
  status: CrmDocumentStatus;
  remarks: string | null;
  created_at: string;
  company?: Pick<CrmCompany, "id" | "name"> | null;
};

export type CrmHelpRequest = {
  id: string;
  organization_id: string;
  company_id: string;
  requested_by_user_id: string;
  assigned_to_user_id: string | null;
  help_type: CrmHelpType;
  title: string;
  description: string | null;
  priority: CrmPriority;
  status: CrmHelpStatus;
  resolution_note: string | null;
  created_at: string;
  company?: Pick<CrmCompany, "id" | "name"> | null;
  requester?: Pick<CrmProfileOption, "full_name" | "email"> | null;
  assignee?: Pick<CrmProfileOption, "full_name" | "email"> | null;
};

export type CrmListFilters = {
  q?: string;
  status?: string;
  priority?: string;
};

export type CrmFormOptions = {
  companies: Array<Pick<CrmCompany, "id" | "name">>;
  contacts: Array<Pick<CrmContact, "id" | "name" | "company_id">>;
  teamMembers: CrmProfileOption[];
  pipelineStages: CrmPipelineStage[];
};
