-- Core CRM module for Sales Master.
-- Uses existing organizations/profiles/roles as the auth and ownership source.

create or replace function public.crm_actor_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.slug
  from public.profiles p
  left join public.roles r on r.id = p.role_id
  where p.id = auth.uid()
  limit 1
$$;

create or replace function public.crm_actor_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.organization_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1
$$;

create or replace function public.crm_profile_visible_to_actor(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with recursive hierarchy(profile_id) as (
    select auth.uid()
    union
    select p.id
    from public.profiles p
    join hierarchy h on p.reports_to_user_id = h.profile_id
  )
  select
    public.crm_actor_role() in ('admin', 'hos')
    or (
      public.crm_actor_role() in ('manager', 'assistant_manager')
      and target_profile_id in (select profile_id from hierarchy)
    )
    or (
      public.crm_actor_role() = 'marketer'
      and target_profile_id = auth.uid()
    )
$$;

create or replace function public.crm_can_manage_records()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.crm_actor_role() in (
    'admin',
    'hos',
    'manager',
    'assistant_manager',
    'marketer'
  )
$$;

create table if not exists public.crm_pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  color text not null default '#0f766e',
  probability integer not null default 0,
  position integer not null default 1,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  is_active boolean not null default true,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_pipeline_probability_chk check (probability between 0 and 100),
  constraint crm_pipeline_color_chk check (color ~ '^#[0-9A-Fa-f]{6}$')
);

create table if not exists public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  lead_source text,
  priority text not null default 'medium',
  assigned_to_user_id uuid references public.profiles(id) on delete set null,
  pipeline_stage_id uuid references public.crm_pipeline_stages(id) on delete set null,
  lead_temperature text not null default 'warm',
  status text not null default 'active',
  phone text,
  email text,
  website text,
  address text,
  city text,
  country text,
  estimated_value numeric(14, 2),
  expected_closing_date date,
  notes text,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  updated_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_companies_priority_chk check (priority in ('low', 'medium', 'high', 'urgent')),
  constraint crm_companies_temperature_chk check (lead_temperature in ('cold', 'warm', 'hot', 'very_hot')),
  constraint crm_companies_status_chk check (status in ('active', 'inactive', 'archived')),
  constraint crm_companies_value_chk check (estimated_value is null or estimated_value >= 0)
);

create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid not null references public.crm_companies(id) on delete cascade,
  name text not null,
  designation text,
  department text,
  mobile text,
  whatsapp text,
  email text,
  decision_role text,
  relationship_level text,
  preferred_contact_method text,
  remarks text,
  is_primary boolean not null default false,
  status text not null default 'active',
  created_by_user_id uuid references public.profiles(id) on delete set null,
  updated_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_contacts_status_chk check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.crm_interactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid not null references public.crm_companies(id) on delete cascade,
  contact_id uuid references public.crm_contacts(id) on delete set null,
  assigned_to_user_id uuid references public.profiles(id) on delete set null,
  interaction_type text not null default 'Phone Call',
  meeting_at timestamptz not null default now(),
  location text,
  online_meeting_link text,
  discussion_details text not null,
  next_action text,
  next_followup_at timestamptz,
  need_help boolean not null default false,
  status text not null default 'active',
  completed_at timestamptz,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  updated_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_interactions_status_chk check (status in ('active', 'inactive', 'archived'))
);

create table if not exists public.crm_followups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid not null references public.crm_companies(id) on delete cascade,
  contact_id uuid references public.crm_contacts(id) on delete set null,
  interaction_id uuid references public.crm_interactions(id) on delete set null,
  assigned_to_user_id uuid references public.profiles(id) on delete set null,
  followup_type text not null default 'Phone Call',
  title text not null,
  description text,
  scheduled_at timestamptz not null,
  priority text not null default 'medium',
  status text not null default 'pending',
  completed_at timestamptz,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  updated_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_followups_priority_chk check (priority in ('low', 'medium', 'high', 'urgent')),
  constraint crm_followups_status_chk check (status in ('pending', 'completed', 'rescheduled', 'cancelled', 'archived'))
);

create table if not exists public.crm_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid not null references public.crm_companies(id) on delete cascade,
  contact_id uuid references public.crm_contacts(id) on delete set null,
  interaction_id uuid references public.crm_interactions(id) on delete set null,
  followup_id uuid references public.crm_followups(id) on delete set null,
  document_type text not null default 'Other',
  title text not null,
  description text,
  file_name text,
  file_url text,
  status text not null default 'draft',
  remarks text,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  updated_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_documents_status_chk check (status in ('draft', 'submitted', 'seen', 'revision_requested', 'approved', 'rejected', 'archived'))
);

create table if not exists public.crm_help_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid not null references public.crm_companies(id) on delete cascade,
  contact_id uuid references public.crm_contacts(id) on delete set null,
  interaction_id uuid references public.crm_interactions(id) on delete set null,
  followup_id uuid references public.crm_followups(id) on delete set null,
  document_id uuid references public.crm_documents(id) on delete set null,
  requested_by_user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_to_user_id uuid references public.profiles(id) on delete set null,
  help_type text not null default 'General Support',
  title text not null,
  description text,
  priority text not null default 'medium',
  status text not null default 'open',
  resolution_note text,
  resolved_at timestamptz,
  resolved_by_user_id uuid references public.profiles(id) on delete set null,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  updated_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_help_priority_chk check (priority in ('low', 'medium', 'high', 'urgent')),
  constraint crm_help_status_chk check (status in ('open', 'in_progress', 'resolved', 'rejected', 'archived'))
);

create table if not exists public.crm_help_request_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  help_request_id uuid not null references public.crm_help_requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  comment text not null,
  is_internal boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists crm_pipeline_stages_org_slug_idx on public.crm_pipeline_stages (organization_id, slug);
create unique index if not exists crm_pipeline_stages_org_position_idx on public.crm_pipeline_stages (organization_id, position);
create index if not exists crm_companies_org_status_updated_idx on public.crm_companies (organization_id, status, updated_at desc);
create index if not exists crm_companies_org_assigned_idx on public.crm_companies (organization_id, assigned_to_user_id);
create index if not exists crm_companies_org_pipeline_idx on public.crm_companies (organization_id, pipeline_stage_id);
create index if not exists crm_contacts_org_company_idx on public.crm_contacts (organization_id, company_id);
create index if not exists crm_interactions_org_meeting_idx on public.crm_interactions (organization_id, meeting_at desc);
create index if not exists crm_followups_org_schedule_idx on public.crm_followups (organization_id, status, scheduled_at asc);
create index if not exists crm_documents_org_company_idx on public.crm_documents (organization_id, company_id, created_at desc);
create index if not exists crm_help_org_status_idx on public.crm_help_requests (organization_id, status, priority, created_at desc);

insert into public.crm_pipeline_stages (
  organization_id,
  name,
  slug,
  color,
  probability,
  position,
  is_won,
  is_lost
)
select
  o.id,
  stage.name,
  stage.slug,
  stage.color,
  stage.probability,
  stage.position,
  stage.is_won,
  stage.is_lost
from public.organizations o
cross join (
  values
    ('New Lead', 'new_lead', '#2563eb', 10, 1, false, false),
    ('Qualified', 'qualified', '#0f766e', 30, 2, false, false),
    ('Proposal', 'proposal', '#7c3aed', 55, 3, false, false),
    ('Negotiation', 'negotiation', '#d97706', 75, 4, false, false),
    ('Won', 'won', '#16a34a', 100, 5, true, false),
    ('Lost', 'lost', '#dc2626', 0, 6, false, true)
) as stage(name, slug, color, probability, position, is_won, is_lost)
on conflict (organization_id, slug) do nothing;

drop trigger if exists set_crm_pipeline_stages_updated_at on public.crm_pipeline_stages;
create trigger set_crm_pipeline_stages_updated_at before update on public.crm_pipeline_stages
for each row execute function public.set_updated_at();

drop trigger if exists set_crm_companies_updated_at on public.crm_companies;
create trigger set_crm_companies_updated_at before update on public.crm_companies
for each row execute function public.set_updated_at();

drop trigger if exists set_crm_contacts_updated_at on public.crm_contacts;
create trigger set_crm_contacts_updated_at before update on public.crm_contacts
for each row execute function public.set_updated_at();

drop trigger if exists set_crm_interactions_updated_at on public.crm_interactions;
create trigger set_crm_interactions_updated_at before update on public.crm_interactions
for each row execute function public.set_updated_at();

drop trigger if exists set_crm_followups_updated_at on public.crm_followups;
create trigger set_crm_followups_updated_at before update on public.crm_followups
for each row execute function public.set_updated_at();

drop trigger if exists set_crm_documents_updated_at on public.crm_documents;
create trigger set_crm_documents_updated_at before update on public.crm_documents
for each row execute function public.set_updated_at();

drop trigger if exists set_crm_help_requests_updated_at on public.crm_help_requests;
create trigger set_crm_help_requests_updated_at before update on public.crm_help_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_crm_help_comments_updated_at on public.crm_help_request_comments;
create trigger set_crm_help_comments_updated_at before update on public.crm_help_request_comments
for each row execute function public.set_updated_at();

alter table public.crm_pipeline_stages enable row level security;
alter table public.crm_companies enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_interactions enable row level security;
alter table public.crm_followups enable row level security;
alter table public.crm_documents enable row level security;
alter table public.crm_help_requests enable row level security;
alter table public.crm_help_request_comments enable row level security;

drop policy if exists crm_pipeline_select_org on public.crm_pipeline_stages;
create policy crm_pipeline_select_org on public.crm_pipeline_stages
for select to authenticated
using (organization_id = public.crm_actor_organization_id());

drop policy if exists crm_pipeline_mutate_admin on public.crm_pipeline_stages;
create policy crm_pipeline_mutate_admin on public.crm_pipeline_stages
for all to authenticated
using (organization_id = public.crm_actor_organization_id() and public.crm_actor_role() in ('admin', 'hos', 'manager'))
with check (organization_id = public.crm_actor_organization_id() and public.crm_actor_role() in ('admin', 'hos', 'manager'));

drop policy if exists crm_companies_select_scope on public.crm_companies;
create policy crm_companies_select_scope on public.crm_companies
for select to authenticated
using (
  organization_id = public.crm_actor_organization_id()
  and (
    public.crm_actor_role() in ('admin', 'hos')
    or public.crm_profile_visible_to_actor(assigned_to_user_id)
    or public.crm_profile_visible_to_actor(created_by_user_id)
  )
);

drop policy if exists crm_companies_mutate_scope on public.crm_companies;
create policy crm_companies_mutate_scope on public.crm_companies
for all to authenticated
using (
  organization_id = public.crm_actor_organization_id()
  and public.crm_can_manage_records()
  and (
    public.crm_actor_role() in ('admin', 'hos')
    or public.crm_profile_visible_to_actor(assigned_to_user_id)
    or public.crm_profile_visible_to_actor(created_by_user_id)
  )
)
with check (
  organization_id = public.crm_actor_organization_id()
  and public.crm_can_manage_records()
);

drop policy if exists crm_contacts_select_scope on public.crm_contacts;
create policy crm_contacts_select_scope on public.crm_contacts
for select to authenticated
using (
  organization_id = public.crm_actor_organization_id()
  and exists (
    select 1 from public.crm_companies c
    where c.id = crm_contacts.company_id
  )
);

drop policy if exists crm_contacts_mutate_scope on public.crm_contacts;
create policy crm_contacts_mutate_scope on public.crm_contacts
for all to authenticated
using (organization_id = public.crm_actor_organization_id() and public.crm_can_manage_records())
with check (organization_id = public.crm_actor_organization_id() and public.crm_can_manage_records());

drop policy if exists crm_interactions_select_scope on public.crm_interactions;
create policy crm_interactions_select_scope on public.crm_interactions
for select to authenticated
using (
  organization_id = public.crm_actor_organization_id()
  and (
    public.crm_actor_role() in ('admin', 'hos')
    or public.crm_profile_visible_to_actor(assigned_to_user_id)
    or public.crm_profile_visible_to_actor(created_by_user_id)
  )
);

drop policy if exists crm_interactions_mutate_scope on public.crm_interactions;
create policy crm_interactions_mutate_scope on public.crm_interactions
for all to authenticated
using (organization_id = public.crm_actor_organization_id() and public.crm_can_manage_records())
with check (organization_id = public.crm_actor_organization_id() and public.crm_can_manage_records());

drop policy if exists crm_followups_select_scope on public.crm_followups;
create policy crm_followups_select_scope on public.crm_followups
for select to authenticated
using (
  organization_id = public.crm_actor_organization_id()
  and (
    public.crm_actor_role() in ('admin', 'hos')
    or public.crm_profile_visible_to_actor(assigned_to_user_id)
    or public.crm_profile_visible_to_actor(created_by_user_id)
  )
);

drop policy if exists crm_followups_mutate_scope on public.crm_followups;
create policy crm_followups_mutate_scope on public.crm_followups
for all to authenticated
using (organization_id = public.crm_actor_organization_id() and public.crm_can_manage_records())
with check (organization_id = public.crm_actor_organization_id() and public.crm_can_manage_records());

drop policy if exists crm_documents_select_scope on public.crm_documents;
create policy crm_documents_select_scope on public.crm_documents
for select to authenticated
using (
  organization_id = public.crm_actor_organization_id()
  and exists (
    select 1 from public.crm_companies c
    where c.id = crm_documents.company_id
  )
);

drop policy if exists crm_documents_mutate_scope on public.crm_documents;
create policy crm_documents_mutate_scope on public.crm_documents
for all to authenticated
using (organization_id = public.crm_actor_organization_id() and public.crm_can_manage_records())
with check (organization_id = public.crm_actor_organization_id() and public.crm_can_manage_records());

drop policy if exists crm_help_select_scope on public.crm_help_requests;
create policy crm_help_select_scope on public.crm_help_requests
for select to authenticated
using (
  organization_id = public.crm_actor_organization_id()
  and (
    public.crm_actor_role() in ('admin', 'hos')
    or public.crm_profile_visible_to_actor(requested_by_user_id)
    or public.crm_profile_visible_to_actor(assigned_to_user_id)
    or public.crm_profile_visible_to_actor(created_by_user_id)
  )
);

drop policy if exists crm_help_mutate_scope on public.crm_help_requests;
create policy crm_help_mutate_scope on public.crm_help_requests
for all to authenticated
using (organization_id = public.crm_actor_organization_id() and public.crm_can_manage_records())
with check (organization_id = public.crm_actor_organization_id() and public.crm_can_manage_records());

drop policy if exists crm_help_comments_select_scope on public.crm_help_request_comments;
create policy crm_help_comments_select_scope on public.crm_help_request_comments
for select to authenticated
using (
  organization_id = public.crm_actor_organization_id()
  and exists (
    select 1 from public.crm_help_requests h
    where h.id = crm_help_request_comments.help_request_id
  )
);

drop policy if exists crm_help_comments_mutate_scope on public.crm_help_request_comments;
create policy crm_help_comments_mutate_scope on public.crm_help_request_comments
for all to authenticated
using (organization_id = public.crm_actor_organization_id() and user_id = auth.uid())
with check (organization_id = public.crm_actor_organization_id() and user_id = auth.uid());
