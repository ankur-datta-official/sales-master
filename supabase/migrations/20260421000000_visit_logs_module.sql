create table if not exists public.visit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  party_id uuid not null references public.parties(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  visit_plan_id uuid references public.visit_plans(id) on delete set null,
  check_in_time timestamptz,
  check_out_time timestamptz,
  check_in_lat double precision,
  check_in_lng double precision,
  check_out_lat double precision,
  check_out_lng double precision,
  notes text not null default '',
  outcome text not null default '',
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visit_logs_status_chk
    check (status in ('completed', 'partial', 'cancelled')),
  constraint visit_logs_check_out_after_in_chk
    check (
      check_in_time is null
      or check_out_time is null
      or check_out_time >= check_in_time
    )
);

create index if not exists visit_logs_org_user_idx
  on public.visit_logs (organization_id, user_id);

create index if not exists visit_logs_org_status_idx
  on public.visit_logs (organization_id, status);

create index if not exists visit_logs_org_party_idx
  on public.visit_logs (organization_id, party_id);

create index if not exists visit_logs_org_created_at_idx
  on public.visit_logs (organization_id, created_at desc);

create index if not exists visit_logs_visit_plan_idx
  on public.visit_logs (visit_plan_id)
  where visit_plan_id is not null;

drop trigger if exists set_visit_logs_updated_at on public.visit_logs;
create trigger set_visit_logs_updated_at
before update on public.visit_logs
for each row
execute function public.set_updated_at();

alter table public.visit_logs enable row level security;

drop policy if exists visit_logs_select_by_role_scope on public.visit_logs;
drop policy if exists visit_logs_insert_marketer_self_or_admin on public.visit_logs;
drop policy if exists visit_logs_update_owner_recent on public.visit_logs;
drop policy if exists visit_logs_update_admin on public.visit_logs;

create policy visit_logs_select_by_role_scope
  on public.visit_logs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = visit_logs.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and (
              visit_logs.user_id = actor.id
              or exists (
                select 1
                from public.get_subordinate_profile_ids(actor.id, false, 25) s
                where s.profile_id = visit_logs.user_id
              )
            )
          )
          or (
            actor_role.slug = 'marketer'
            and visit_logs.user_id = actor.id
          )
        )
    )
  );

create policy visit_logs_insert_marketer_self_or_admin
  on public.visit_logs
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      join public.profiles assignee on assignee.id = visit_logs.user_id
      where actor.id = auth.uid()
        and actor.organization_id = visit_logs.organization_id
        and assignee.organization_id = visit_logs.organization_id
        and exists (
          select 1
          from public.parties p
          where p.id = visit_logs.party_id
            and p.organization_id = visit_logs.organization_id
        )
        and (
          (
            actor_role.slug = 'marketer'
            and visit_logs.user_id = actor.id
          )
          or actor_role.slug = 'admin'
        )
    )
  );

-- Owner may correct recent logs (v1 window: 72 hours from created_at)
create policy visit_logs_update_owner_recent
  on public.visit_logs
  for update
  to authenticated
  using (
    visit_logs.user_id = auth.uid()
    and visit_logs.created_at > (now() - interval '72 hours')
  )
  with check (
    visit_logs.user_id = auth.uid()
    and visit_logs.created_at > (now() - interval '72 hours')
  );

create policy visit_logs_update_admin
  on public.visit_logs
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = visit_logs.organization_id
        and actor_role.slug = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = visit_logs.organization_id
        and actor_role.slug = 'admin'
    )
  );
