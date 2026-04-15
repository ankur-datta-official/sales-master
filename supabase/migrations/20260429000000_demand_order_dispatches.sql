-- Factory queue: one dispatch row per demand order in factory_queue / sent_to_factory.

create table if not exists public.demand_order_dispatches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  demand_order_id uuid not null references public.demand_orders(id) on delete cascade,
  factory_status text not null default 'pending',
  challan_no text,
  memo_no text,
  dispatch_date date,
  remarks text not null default '',
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint demand_order_dispatches_factory_status_chk
    check (factory_status in ('pending', 'processing', 'ready', 'dispatched', 'delivered')),
  constraint demand_order_dispatches_order_unique unique (demand_order_id)
);

create index if not exists demand_order_dispatches_org_status_idx
  on public.demand_order_dispatches (organization_id, factory_status);

create index if not exists demand_order_dispatches_org_updated_idx
  on public.demand_order_dispatches (organization_id, updated_at desc);

drop trigger if exists set_demand_order_dispatches_updated_at on public.demand_order_dispatches;
create trigger set_demand_order_dispatches_updated_at
before update on public.demand_order_dispatches
for each row
execute function public.set_updated_at();

-- Create dispatch row when an order is released to factory (bypasses RLS).
create or replace function public.ensure_demand_order_dispatch_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stage = 'factory_queue' and new.status = 'sent_to_factory' then
    insert into public.demand_order_dispatches (organization_id, demand_order_id)
    values (new.organization_id, new.id)
    on conflict (demand_order_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists demand_orders_ensure_dispatch on public.demand_orders;
create trigger demand_orders_ensure_dispatch
after insert or update of stage, status on public.demand_orders
for each row
execute function public.ensure_demand_order_dispatch_row();

insert into public.demand_order_dispatches (organization_id, demand_order_id)
select o.organization_id, o.id
from public.demand_orders o
where o.stage = 'factory_queue'
  and o.status = 'sent_to_factory'
on conflict (demand_order_id) do nothing;

-- Factory operators need to open demand order context for in-factory orders.
drop policy if exists demand_orders_select_by_role_scope on public.demand_orders;
create policy demand_orders_select_by_role_scope
  on public.demand_orders
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug in ('admin', 'hos', 'accounts')
          or (
            actor_role.slug = 'factory_operator'
            and demand_orders.stage = 'factory_queue'
            and demand_orders.status = 'sent_to_factory'
          )
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and (
              demand_orders.created_by_user_id = actor.id
              or exists (
                select 1
                from public.get_subordinate_profile_ids(actor.id, false, 25) s
                where s.profile_id = demand_orders.created_by_user_id
              )
            )
          )
          or (
            actor_role.slug = 'marketer'
            and demand_orders.created_by_user_id = actor.id
          )
        )
    )
  );

alter table public.demand_order_dispatches enable row level security;

drop policy if exists demand_order_dispatches_select_by_role_scope on public.demand_order_dispatches;
drop policy if exists demand_order_dispatches_update_factory_or_admin on public.demand_order_dispatches;

create policy demand_order_dispatches_select_by_role_scope
  on public.demand_order_dispatches
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      join public.demand_orders o on o.id = demand_order_dispatches.demand_order_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_order_dispatches.organization_id
        and o.organization_id = demand_order_dispatches.organization_id
        and (
          actor_role.slug in ('admin', 'hos', 'accounts', 'factory_operator')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and (
              o.created_by_user_id = actor.id
              or exists (
                select 1
                from public.get_subordinate_profile_ids(actor.id, false, 25) s
                where s.profile_id = o.created_by_user_id
              )
            )
          )
          or (
            actor_role.slug = 'marketer'
            and o.created_by_user_id = actor.id
          )
        )
    )
  );

create policy demand_order_dispatches_update_factory_or_admin
  on public.demand_order_dispatches
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.demand_orders o
      join public.profiles actor on actor.id = auth.uid()
        and actor.organization_id = o.organization_id
      join public.roles actor_role on actor_role.id = actor.role_id
      where o.id = demand_order_dispatches.demand_order_id
        and o.organization_id = demand_order_dispatches.organization_id
        and o.stage = 'factory_queue'
        and o.status = 'sent_to_factory'
        and actor_role.slug in ('factory_operator', 'admin')
    )
  )
  with check (
    demand_order_dispatches.organization_id = (
      select p.organization_id from public.profiles p where p.id = auth.uid()
    )
    and exists (
      select 1
      from public.demand_orders o
      where o.id = demand_order_dispatches.demand_order_id
        and o.organization_id = demand_order_dispatches.organization_id
        and o.stage = 'factory_queue'
        and o.status = 'sent_to_factory'
    )
    and demand_order_dispatches.updated_by = auth.uid()
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_order_dispatches.organization_id
        and actor_role.slug in ('factory_operator', 'admin')
    )
  );

create or replace function public.demand_order_dispatches_guard_immutable()
returns trigger
language plpgsql
as $$
begin
  if new.demand_order_id is distinct from old.demand_order_id
     or new.organization_id is distinct from old.organization_id then
    raise exception 'demand_order_id and organization_id cannot change';
  end if;
  return new;
end;
$$;

drop trigger if exists demand_order_dispatches_guard_immutable on public.demand_order_dispatches;
create trigger demand_order_dispatches_guard_immutable
before update on public.demand_order_dispatches
for each row
execute function public.demand_order_dispatches_guard_immutable();

grant select on public.demand_order_dispatches to authenticated;
grant update on public.demand_order_dispatches to authenticated;
