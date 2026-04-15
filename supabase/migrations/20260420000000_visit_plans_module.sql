create table if not exists public.visit_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  party_id uuid not null references public.parties(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  visit_date date not null,
  purpose text not null,
  status text not null default 'planned',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visit_plans_status_chk
    check (status in ('planned', 'completed', 'skipped', 'cancelled'))
);

create index if not exists visit_plans_org_user_idx
  on public.visit_plans (organization_id, user_id);

create index if not exists visit_plans_org_date_idx
  on public.visit_plans (organization_id, visit_date);

create index if not exists visit_plans_org_status_idx
  on public.visit_plans (organization_id, status);

create index if not exists visit_plans_org_party_idx
  on public.visit_plans (organization_id, party_id);

drop trigger if exists set_visit_plans_updated_at on public.visit_plans;
create trigger set_visit_plans_updated_at
before update on public.visit_plans
for each row
execute function public.set_updated_at();

alter table public.visit_plans enable row level security;

drop policy if exists visit_plans_select_by_role_scope on public.visit_plans;
drop policy if exists visit_plans_insert_marketer_self_or_admin on public.visit_plans;
drop policy if exists visit_plans_update_planned_owner_fields on public.visit_plans;
drop policy if exists visit_plans_update_planned_owner_status on public.visit_plans;

create policy visit_plans_select_by_role_scope
  on public.visit_plans
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = visit_plans.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and (
              visit_plans.user_id = actor.id
              or exists (
                select 1
                from public.get_subordinate_profile_ids(actor.id, false, 25) s
                where s.profile_id = visit_plans.user_id
              )
            )
          )
          or (
            actor_role.slug = 'marketer'
            and visit_plans.user_id = actor.id
          )
        )
    )
  );

create policy visit_plans_insert_marketer_self_or_admin
  on public.visit_plans
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = visit_plans.organization_id
        and visit_plans.created_by = actor.id
        and (
          (
            actor_role.slug = 'marketer'
            and visit_plans.user_id = actor.id
          )
          or actor_role.slug = 'admin'
        )
    )
  );

create policy visit_plans_update_planned_owner_fields
  on public.visit_plans
  for update
  to authenticated
  using (
    visit_plans.status = 'planned'
    and visit_plans.user_id = auth.uid()
  )
  with check (
    visit_plans.status = 'planned'
    and visit_plans.user_id = auth.uid()
  );

create policy visit_plans_update_planned_owner_status
  on public.visit_plans
  for update
  to authenticated
  using (
    visit_plans.status = 'planned'
    and visit_plans.user_id = auth.uid()
  )
  with check (
    visit_plans.user_id = auth.uid()
    and visit_plans.status in ('completed', 'skipped', 'cancelled')
  );
