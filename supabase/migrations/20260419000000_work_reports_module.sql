create table if not exists public.work_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  report_date date not null,
  summary text not null,
  achievements text,
  challenges text,
  next_step text,
  status text not null default 'draft',
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_reports_status_chk
    check (status in ('draft', 'submitted', 'approved', 'rejected'))
);

create index if not exists work_reports_org_owner_idx
  on public.work_reports (organization_id, owner_user_id);

create index if not exists work_reports_org_date_idx
  on public.work_reports (organization_id, report_date);

create index if not exists work_reports_org_status_idx
  on public.work_reports (organization_id, status);

drop trigger if exists set_work_reports_updated_at on public.work_reports;
create trigger set_work_reports_updated_at
before update on public.work_reports
for each row
execute function public.set_updated_at();

alter table public.work_reports enable row level security;

drop policy if exists work_reports_select_by_role_scope on public.work_reports;
drop policy if exists work_reports_insert_owner_or_admin on public.work_reports;
drop policy if exists work_reports_update_draft_owner_or_admin on public.work_reports;
drop policy if exists work_reports_review_scope on public.work_reports;

create policy work_reports_select_by_role_scope
  on public.work_reports
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = work_reports.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and (
              work_reports.owner_user_id = actor.id
              or exists (
                select 1
                from public.get_subordinate_profile_ids(actor.id, false, 25) s
                where s.profile_id = work_reports.owner_user_id
              )
            )
          )
          or (
            actor_role.slug = 'marketer'
            and work_reports.owner_user_id = actor.id
          )
        )
    )
  );

create policy work_reports_insert_owner_or_admin
  on public.work_reports
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = work_reports.organization_id
        and (
          (actor_role.slug = 'marketer' and work_reports.owner_user_id = actor.id)
          or actor_role.slug = 'admin'
        )
    )
  );

create policy work_reports_update_draft_owner_or_admin
  on public.work_reports
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = work_reports.organization_id
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and work_reports.owner_user_id = actor.id
            and work_reports.status = 'draft'
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = work_reports.organization_id
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and work_reports.owner_user_id = actor.id
          )
        )
    )
  );

create policy work_reports_review_scope
  on public.work_reports
  for update
  to authenticated
  using (
    work_reports.status = 'submitted'
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = work_reports.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and exists (
              select 1
              from public.get_subordinate_profile_ids(actor.id, false, 25) s
              where s.profile_id = work_reports.owner_user_id
            )
          )
        )
    )
  )
  with check (
    work_reports.status in ('approved', 'rejected')
  );
