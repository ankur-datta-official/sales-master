create table if not exists public.sales_targets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assigned_to_user_id uuid not null references public.profiles(id) on delete cascade,
  party_id uuid references public.parties(id) on delete set null,
  period_type text not null,
  start_date date not null,
  end_date date not null,
  target_amount numeric(18, 2) not null,
  target_qty numeric(18, 4),
  status text not null default 'draft',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_targets_period_type_chk
    check (period_type in ('daily', 'weekly', 'monthly')),
  constraint sales_targets_status_chk
    check (status in ('draft', 'active', 'completed', 'cancelled')),
  constraint sales_targets_date_range_chk
    check (start_date <= end_date),
  constraint sales_targets_amount_positive_chk
    check (target_amount > 0),
  constraint sales_targets_qty_nonnegative_chk
    check (target_qty is null or target_qty >= 0)
);

create index if not exists sales_targets_org_assignee_idx
  on public.sales_targets (organization_id, assigned_to_user_id);

create index if not exists sales_targets_org_dates_idx
  on public.sales_targets (organization_id, start_date, end_date);

create index if not exists sales_targets_org_status_idx
  on public.sales_targets (organization_id, status);

create index if not exists sales_targets_org_party_idx
  on public.sales_targets (organization_id, party_id)
  where party_id is not null;

drop trigger if exists set_sales_targets_updated_at on public.sales_targets;
create trigger set_sales_targets_updated_at
before update on public.sales_targets
for each row
execute function public.set_updated_at();

alter table public.sales_targets enable row level security;

drop policy if exists sales_targets_select_by_role_scope on public.sales_targets;
drop policy if exists sales_targets_insert_mgr_hos_admin on public.sales_targets;
drop policy if exists sales_targets_update_admin_hos on public.sales_targets;
drop policy if exists sales_targets_update_manager_scope on public.sales_targets;

create policy sales_targets_select_by_role_scope
  on public.sales_targets
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = sales_targets.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and (
              sales_targets.assigned_to_user_id = actor.id
              or exists (
                select 1
                from public.get_subordinate_profile_ids(actor.id, false, 25) s
                where s.profile_id = sales_targets.assigned_to_user_id
              )
            )
          )
          or (
            actor_role.slug = 'marketer'
            and sales_targets.assigned_to_user_id = actor.id
          )
        )
    )
  );

create policy sales_targets_insert_mgr_hos_admin
  on public.sales_targets
  for insert
  to authenticated
  with check (
    sales_targets.created_by = auth.uid()
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      join public.profiles assignee on assignee.id = sales_targets.assigned_to_user_id
      where actor.id = auth.uid()
        and actor.organization_id = sales_targets.organization_id
        and assignee.organization_id = sales_targets.organization_id
        and (
          sales_targets.party_id is null
          or exists (
            select 1
            from public.parties p
            where p.id = sales_targets.party_id
              and p.organization_id = sales_targets.organization_id
          )
        )
        and (
          (
            actor_role.slug = 'admin'
          )
          or (
            actor_role.slug = 'hos'
          )
          or (
            actor_role.slug = 'manager'
            and (
              sales_targets.assigned_to_user_id = actor.id
              or exists (
                select 1 from public.get_subordinate_profile_ids(actor.id, false, 25) s
                where s.profile_id = sales_targets.assigned_to_user_id
              )
            )
          )
        )
    )
  );

create policy sales_targets_update_admin_hos
  on public.sales_targets
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = sales_targets.organization_id
        and actor_role.slug in ('admin', 'hos')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      join public.profiles assignee on assignee.id = sales_targets.assigned_to_user_id
      where actor.id = auth.uid()
        and actor.organization_id = sales_targets.organization_id
        and assignee.organization_id = sales_targets.organization_id
        and actor_role.slug in ('admin', 'hos')
        and (
          sales_targets.party_id is null
          or exists (
            select 1
            from public.parties p
            where p.id = sales_targets.party_id
              and p.organization_id = sales_targets.organization_id
          )
        )
    )
  );

create policy sales_targets_update_manager_scope
  on public.sales_targets
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = sales_targets.organization_id
        and actor_role.slug = 'manager'
        and (
          sales_targets.assigned_to_user_id = actor.id
          or exists (
            select 1
            from public.get_subordinate_profile_ids(actor.id, false, 25) s
            where s.profile_id = sales_targets.assigned_to_user_id
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      join public.profiles assignee on assignee.id = sales_targets.assigned_to_user_id
      where actor.id = auth.uid()
        and actor.organization_id = sales_targets.organization_id
        and actor_role.slug = 'manager'
        and assignee.organization_id = sales_targets.organization_id
        and (
          sales_targets.assigned_to_user_id = actor.id
          or exists (
            select 1
            from public.get_subordinate_profile_ids(actor.id, false, 25) s
            where s.profile_id = sales_targets.assigned_to_user_id
          )
        )
        and (
          sales_targets.party_id is null
          or exists (
            select 1
            from public.parties p
            where p.id = sales_targets.party_id
              and p.organization_id = sales_targets.organization_id
          )
        )
    )
  );
