create table if not exists public.collection_targets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assigned_to_user_id uuid not null references public.profiles(id) on delete cascade,
  party_id uuid references public.parties(id) on delete set null,
  period_type text not null,
  start_date date not null,
  end_date date not null,
  target_amount numeric(18, 2) not null,
  status text not null default 'draft',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collection_targets_period_type_chk
    check (period_type in ('daily', 'weekly', 'monthly')),
  constraint collection_targets_status_chk
    check (status in ('draft', 'active', 'completed', 'cancelled')),
  constraint collection_targets_date_range_chk
    check (start_date <= end_date),
  constraint collection_targets_amount_positive_chk
    check (target_amount > 0)
);

create index if not exists collection_targets_org_assignee_idx
  on public.collection_targets (organization_id, assigned_to_user_id);

create index if not exists collection_targets_org_dates_idx
  on public.collection_targets (organization_id, start_date, end_date);

create index if not exists collection_targets_org_status_idx
  on public.collection_targets (organization_id, status);

create index if not exists collection_targets_org_party_idx
  on public.collection_targets (organization_id, party_id)
  where party_id is not null;

drop trigger if exists set_collection_targets_updated_at on public.collection_targets;
create trigger set_collection_targets_updated_at
before update on public.collection_targets
for each row
execute function public.set_updated_at();

alter table public.collection_targets enable row level security;

drop policy if exists collection_targets_select_by_role_scope on public.collection_targets;
drop policy if exists collection_targets_insert_mgr_hos_admin on public.collection_targets;
drop policy if exists collection_targets_update_admin_hos on public.collection_targets;
drop policy if exists collection_targets_update_manager_scope on public.collection_targets;

create policy collection_targets_select_by_role_scope
  on public.collection_targets
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = collection_targets.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and (
              collection_targets.assigned_to_user_id = actor.id
              or exists (
                select 1
                from public.get_subordinate_profile_ids(actor.id, false, 25) s
                where s.profile_id = collection_targets.assigned_to_user_id
              )
            )
          )
          or (
            actor_role.slug = 'marketer'
            and collection_targets.assigned_to_user_id = actor.id
          )
        )
    )
  );

create policy collection_targets_insert_mgr_hos_admin
  on public.collection_targets
  for insert
  to authenticated
  with check (
    collection_targets.created_by = auth.uid()
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      join public.profiles assignee on assignee.id = collection_targets.assigned_to_user_id
      where actor.id = auth.uid()
        and actor.organization_id = collection_targets.organization_id
        and assignee.organization_id = collection_targets.organization_id
        and (
          collection_targets.party_id is null
          or exists (
            select 1
            from public.parties p
            where p.id = collection_targets.party_id
              and p.organization_id = collection_targets.organization_id
          )
        )
        and (
          actor_role.slug = 'admin'
          or actor_role.slug = 'hos'
          or (
            actor_role.slug = 'manager'
            and (
              collection_targets.assigned_to_user_id = actor.id
              or exists (
                select 1 from public.get_subordinate_profile_ids(actor.id, false, 25) s
                where s.profile_id = collection_targets.assigned_to_user_id
              )
            )
          )
        )
    )
  );

create policy collection_targets_update_admin_hos
  on public.collection_targets
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = collection_targets.organization_id
        and actor_role.slug in ('admin', 'hos')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      join public.profiles assignee on assignee.id = collection_targets.assigned_to_user_id
      where actor.id = auth.uid()
        and actor.organization_id = collection_targets.organization_id
        and assignee.organization_id = collection_targets.organization_id
        and actor_role.slug in ('admin', 'hos')
        and (
          collection_targets.party_id is null
          or exists (
            select 1
            from public.parties p
            where p.id = collection_targets.party_id
              and p.organization_id = collection_targets.organization_id
          )
        )
    )
  );

create policy collection_targets_update_manager_scope
  on public.collection_targets
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = collection_targets.organization_id
        and actor_role.slug = 'manager'
        and (
          collection_targets.assigned_to_user_id = actor.id
          or exists (
            select 1
            from public.get_subordinate_profile_ids(actor.id, false, 25) s
            where s.profile_id = collection_targets.assigned_to_user_id
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      join public.profiles assignee on assignee.id = collection_targets.assigned_to_user_id
      where actor.id = auth.uid()
        and actor.organization_id = collection_targets.organization_id
        and actor_role.slug = 'manager'
        and assignee.organization_id = collection_targets.organization_id
        and (
          collection_targets.assigned_to_user_id = actor.id
          or exists (
            select 1
            from public.get_subordinate_profile_ids(actor.id, false, 25) s
            where s.profile_id = collection_targets.assigned_to_user_id
          )
        )
        and (
          collection_targets.party_id is null
          or exists (
            select 1
            from public.parties p
            where p.id = collection_targets.party_id
              and p.organization_id = collection_targets.organization_id
          )
        )
    )
  );
