create table if not exists public.work_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  plan_date date not null,
  title text not null,
  details text not null,
  priority text,
  status text not null default 'draft',
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_plans_status_chk
    check (status in ('draft', 'submitted', 'approved', 'rejected')),
  constraint work_plans_priority_chk
    check (priority is null or priority in ('low', 'medium', 'high'))
);

create index if not exists work_plans_org_owner_idx
  on public.work_plans (organization_id, owner_user_id);

create index if not exists work_plans_org_date_idx
  on public.work_plans (organization_id, plan_date);

create index if not exists work_plans_org_status_idx
  on public.work_plans (organization_id, status);

create index if not exists work_plans_org_priority_idx
  on public.work_plans (organization_id, priority);

drop trigger if exists set_work_plans_updated_at on public.work_plans;
create trigger set_work_plans_updated_at
before update on public.work_plans
for each row
execute function public.set_updated_at();

alter table public.work_plans enable row level security;

drop policy if exists work_plans_select_by_role_scope on public.work_plans;
drop policy if exists work_plans_insert_owner_or_admin on public.work_plans;
drop policy if exists work_plans_update_draft_owner_or_admin on public.work_plans;
drop policy if exists work_plans_review_scope on public.work_plans;

create policy work_plans_select_by_role_scope
  on public.work_plans
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = work_plans.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and (
              work_plans.owner_user_id = actor.id
              or exists (
                select 1
                from public.get_subordinate_profile_ids(actor.id, false, 25) s
                where s.profile_id = work_plans.owner_user_id
              )
            )
          )
          or (
            actor_role.slug = 'marketer'
            and work_plans.owner_user_id = actor.id
          )
        )
    )
  );

create policy work_plans_insert_owner_or_admin
  on public.work_plans
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = work_plans.organization_id
        and (
          (actor_role.slug = 'marketer' and work_plans.owner_user_id = actor.id)
          or actor_role.slug = 'admin'
        )
    )
  );

create policy work_plans_update_draft_owner_or_admin
  on public.work_plans
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = work_plans.organization_id
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and work_plans.owner_user_id = actor.id
            and work_plans.status = 'draft'
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
        and actor.organization_id = work_plans.organization_id
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and work_plans.owner_user_id = actor.id
          )
        )
    )
  );

create policy work_plans_review_scope
  on public.work_plans
  for update
  to authenticated
  using (
    work_plans.status = 'submitted'
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = work_plans.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and exists (
              select 1
              from public.get_subordinate_profile_ids(actor.id, false, 25) s
              where s.profile_id = work_plans.owner_user_id
            )
          )
        )
    )
  )
  with check (
    work_plans.status in ('approved', 'rejected')
  );
