-- Approval logs (v1: demand_order entity) + demand order review statuses (under_review) and RLS.

alter table public.demand_orders drop constraint if exists demand_orders_status_chk;
alter table public.demand_orders add constraint demand_orders_status_chk
  check (status in ('draft', 'submitted', 'under_review', 'approved', 'rejected'));

create table if not exists public.approval_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  from_user_id uuid references public.profiles(id) on delete set null,
  to_user_id uuid references public.profiles(id) on delete set null,
  acted_by_user_id uuid not null references public.profiles(id) on delete restrict,
  note text not null default '',
  created_at timestamptz not null default now(),
  constraint approval_logs_entity_type_chk
    check (entity_type in ('demand_order')),
  constraint approval_logs_action_chk
    check (action in ('submit', 'approve', 'reject', 'forward'))
);

create index if not exists approval_logs_org_created_idx
  on public.approval_logs (organization_id, created_at desc);

create index if not exists approval_logs_entity_idx
  on public.approval_logs (entity_type, entity_id);

alter table public.approval_logs enable row level security;

drop policy if exists approval_logs_select_demand_order_scope on public.approval_logs;
drop policy if exists approval_logs_insert_submit on public.approval_logs;
drop policy if exists approval_logs_insert_review on public.approval_logs;

-- Visible when the related demand order is visible (RLS on demand_orders applies inside EXISTS).
create policy approval_logs_select_demand_order_scope
  on public.approval_logs
  for select
  to authenticated
  using (
    approval_logs.entity_type = 'demand_order'
    and exists (
      select 1
      from public.demand_orders o
      where o.id = approval_logs.entity_id
        and o.organization_id = approval_logs.organization_id
    )
  );

-- Submit log: actor is admin or the order owner (marketer self-submit or admin on behalf).
create policy approval_logs_insert_submit
  on public.approval_logs
  for insert
  to authenticated
  with check (
    approval_logs.entity_type = 'demand_order'
    and approval_logs.action = 'submit'
    and approval_logs.acted_by_user_id = auth.uid()
    and approval_logs.organization_id = (
      select p.organization_id from public.profiles p where p.id = auth.uid()
    )
    and exists (
      select 1
      from public.demand_orders o
      join public.profiles actor on actor.id = auth.uid()
      join public.roles actor_role on actor_role.id = actor.role_id
      where o.id = approval_logs.entity_id
        and o.organization_id = approval_logs.organization_id
        and actor.organization_id = o.organization_id
        and o.status = 'submitted'
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and o.created_by_user_id = actor.id
          )
        )
    )
  );

-- Approve / reject / forward: reviewers only; not the order owner; order in reviewable state.
create policy approval_logs_insert_review
  on public.approval_logs
  for insert
  to authenticated
  with check (
    approval_logs.entity_type = 'demand_order'
    and approval_logs.action in ('approve', 'reject', 'forward')
    and approval_logs.acted_by_user_id = auth.uid()
    and approval_logs.organization_id = (
      select p.organization_id from public.profiles p where p.id = auth.uid()
    )
    and exists (
      select 1
      from public.demand_orders o
      join public.profiles actor on actor.id = auth.uid()
      join public.roles actor_role on actor_role.id = actor.role_id
      where o.id = approval_logs.entity_id
        and o.organization_id = approval_logs.organization_id
        and actor.organization_id = o.organization_id
        and o.created_by_user_id <> actor.id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and exists (
              select 1
              from public.get_subordinate_profile_ids(actor.id, false, 25) s
              where s.profile_id = o.created_by_user_id
            )
          )
        )
        and (
          (
            approval_logs.action in ('approve', 'reject')
            and o.status in ('submitted', 'under_review')
          )
          or (
            approval_logs.action = 'forward'
            and o.status = 'submitted'
            and approval_logs.to_user_id is not null
            and approval_logs.to_user_id <> o.created_by_user_id
            and exists (
              select 1
              from public.profiles tu
              where tu.id = approval_logs.to_user_id
                and tu.organization_id = o.organization_id
            )
          )
        )
    )
  );

-- Demand order review updates (separate from draft edit and initial submit).
drop policy if exists demand_orders_review_approve on public.demand_orders;
drop policy if exists demand_orders_review_reject on public.demand_orders;
drop policy if exists demand_orders_review_forward_under_review on public.demand_orders;

create policy demand_orders_review_approve
  on public.demand_orders
  for update
  to authenticated
  using (
    demand_orders.status in ('submitted', 'under_review')
    and demand_orders.created_by_user_id <> auth.uid()
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and exists (
              select 1
              from public.get_subordinate_profile_ids(actor.id, false, 25) s
              where s.profile_id = demand_orders.created_by_user_id
            )
          )
        )
    )
  )
  with check (
    demand_orders.status = 'approved'
    and demand_orders.created_by_user_id <> auth.uid()
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and exists (
              select 1
              from public.get_subordinate_profile_ids(actor.id, false, 25) s
              where s.profile_id = demand_orders.created_by_user_id
            )
          )
        )
    )
  );

create policy demand_orders_review_reject
  on public.demand_orders
  for update
  to authenticated
  using (
    demand_orders.status in ('submitted', 'under_review')
    and demand_orders.created_by_user_id <> auth.uid()
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and exists (
              select 1
              from public.get_subordinate_profile_ids(actor.id, false, 25) s
              where s.profile_id = demand_orders.created_by_user_id
            )
          )
        )
    )
  )
  with check (
    demand_orders.status = 'rejected'
    and demand_orders.created_by_user_id <> auth.uid()
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and exists (
              select 1
              from public.get_subordinate_profile_ids(actor.id, false, 25) s
              where s.profile_id = demand_orders.created_by_user_id
            )
          )
        )
    )
  );

create policy demand_orders_review_forward_under_review
  on public.demand_orders
  for update
  to authenticated
  using (
    demand_orders.status = 'submitted'
    and demand_orders.created_by_user_id <> auth.uid()
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and exists (
              select 1
              from public.get_subordinate_profile_ids(actor.id, false, 25) s
              where s.profile_id = demand_orders.created_by_user_id
            )
          )
        )
    )
  )
  with check (
    demand_orders.status = 'under_review'
    and demand_orders.created_by_user_id <> auth.uid()
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and exists (
              select 1
              from public.get_subordinate_profile_ids(actor.id, false, 25) s
              where s.profile_id = demand_orders.created_by_user_id
            )
          )
        )
    )
  );
