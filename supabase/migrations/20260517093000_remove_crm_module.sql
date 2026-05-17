-- Remove CRM module schema objects after app-level retirement.

drop policy if exists crm_help_comments_mutate_scope on public.crm_help_request_comments;
drop policy if exists crm_help_comments_select_scope on public.crm_help_request_comments;
drop policy if exists crm_help_mutate_scope on public.crm_help_requests;
drop policy if exists crm_help_select_scope on public.crm_help_requests;
drop policy if exists crm_documents_mutate_scope on public.crm_documents;
drop policy if exists crm_documents_select_scope on public.crm_documents;
drop policy if exists crm_followups_mutate_scope on public.crm_followups;
drop policy if exists crm_followups_select_scope on public.crm_followups;
drop policy if exists crm_interactions_mutate_scope on public.crm_interactions;
drop policy if exists crm_interactions_select_scope on public.crm_interactions;
drop policy if exists crm_contacts_mutate_scope on public.crm_contacts;
drop policy if exists crm_contacts_select_scope on public.crm_contacts;
drop policy if exists crm_companies_mutate_scope on public.crm_companies;
drop policy if exists crm_companies_select_scope on public.crm_companies;
drop policy if exists crm_pipeline_mutate_admin on public.crm_pipeline_stages;
drop policy if exists crm_pipeline_select_org on public.crm_pipeline_stages;

drop trigger if exists set_crm_help_comments_updated_at on public.crm_help_request_comments;
drop trigger if exists set_crm_help_requests_updated_at on public.crm_help_requests;
drop trigger if exists set_crm_documents_updated_at on public.crm_documents;
drop trigger if exists set_crm_followups_updated_at on public.crm_followups;
drop trigger if exists set_crm_interactions_updated_at on public.crm_interactions;
drop trigger if exists set_crm_contacts_updated_at on public.crm_contacts;
drop trigger if exists set_crm_companies_updated_at on public.crm_companies;
drop trigger if exists set_crm_pipeline_stages_updated_at on public.crm_pipeline_stages;

drop index if exists public.crm_help_org_status_idx;
drop index if exists public.crm_documents_org_company_idx;
drop index if exists public.crm_followups_org_schedule_idx;
drop index if exists public.crm_interactions_org_meeting_idx;
drop index if exists public.crm_contacts_org_company_idx;
drop index if exists public.crm_companies_org_pipeline_idx;
drop index if exists public.crm_companies_org_assigned_idx;
drop index if exists public.crm_companies_org_status_updated_idx;
drop index if exists public.crm_pipeline_stages_org_position_idx;
drop index if exists public.crm_pipeline_stages_org_slug_idx;

drop table if exists public.crm_help_request_comments;
drop table if exists public.crm_help_requests;
drop table if exists public.crm_documents;
drop table if exists public.crm_followups;
drop table if exists public.crm_interactions;
drop table if exists public.crm_contacts;
drop table if exists public.crm_companies;
drop table if exists public.crm_pipeline_stages;

drop function if exists public.crm_can_manage_records();
drop function if exists public.crm_profile_visible_to_actor(uuid);
drop function if exists public.crm_actor_organization_id();
drop function if exists public.crm_actor_role();
