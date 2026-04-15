-- Demand orders (header + line items). Total is maintained by trigger; line_total is generated.

create table if not exists public.demand_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  party_id uuid not null references public.parties(id) on delete restrict,
  created_by_user_id uuid not null references public.profiles(id) on delete cascade,
  order_date date not null,
  status text not null default 'draft',
  total_amount numeric(18, 2) not null default 0,
  remarks text not null default '',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint demand_orders_status_chk
    check (status in ('draft', 'submitted', 'approved', 'rejected')),
  constraint demand_orders_total_nonnegative_chk
    check (total_amount >= 0)
);

create table if not exists public.demand_order_items (
  id uuid primary key default gen_random_uuid(),
  demand_order_id uuid not null references public.demand_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(18, 4) not null,
  unit_price numeric(18, 2) not null,
  line_total numeric(18, 2) not null generated always as (round(quantity * unit_price, 2)) stored,
  remark text not null default '',
  constraint demand_order_items_quantity_positive_chk
    check (quantity > 0),
  constraint demand_order_items_unit_price_nonnegative_chk
    check (unit_price >= 0)
);

create index if not exists demand_orders_org_creator_idx
  on public.demand_orders (organization_id, created_by_user_id);

create index if not exists demand_orders_org_date_idx
  on public.demand_orders (organization_id, order_date desc);

create index if not exists demand_orders_org_status_idx
  on public.demand_orders (organization_id, status);

create index if not exists demand_orders_org_party_idx
  on public.demand_orders (organization_id, party_id);

create index if not exists demand_order_items_order_idx
  on public.demand_order_items (demand_order_id);

create or replace function public.recalc_demand_order_total(p_order_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.demand_orders d
  set total_amount = coalesce(
    (
      select sum(i.line_total)
      from public.demand_order_items i
      where i.demand_order_id = p_order_id
    ),
    0
  )
  where d.id = p_order_id;
end;
$$;

create or replace function public.demand_order_items_touch_total()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.recalc_demand_order_total(coalesce(new.demand_order_id, old.demand_order_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists demand_order_items_recalc_total_ins on public.demand_order_items;
create trigger demand_order_items_recalc_total_ins
after insert on public.demand_order_items
for each row
execute function public.demand_order_items_touch_total();

drop trigger if exists demand_order_items_recalc_total_upd on public.demand_order_items;
create trigger demand_order_items_recalc_total_upd
after update on public.demand_order_items
for each row
execute function public.demand_order_items_touch_total();

drop trigger if exists demand_order_items_recalc_total_del on public.demand_order_items;
create trigger demand_order_items_recalc_total_del
after delete on public.demand_order_items
for each row
execute function public.demand_order_items_touch_total();

-- Replace all line items in one transaction (invoker = RLS still applies).
create or replace function public.replace_demand_order_items(p_order_id uuid, p_items jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.demand_order_items
  where demand_order_id = p_order_id;

  insert into public.demand_order_items (demand_order_id, product_id, quantity, unit_price, remark)
  select
    p_order_id,
    (elem->>'product_id')::uuid,
    (elem->>'quantity')::numeric,
    (elem->>'unit_price')::numeric,
    coalesce(nullif(trim(elem->>'remark'), ''), '')
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as elem;
end;
$$;

grant execute on function public.replace_demand_order_items(uuid, jsonb) to authenticated;

drop trigger if exists set_demand_orders_updated_at on public.demand_orders;
create trigger set_demand_orders_updated_at
before update on public.demand_orders
for each row
execute function public.set_updated_at();

alter table public.demand_orders enable row level security;
alter table public.demand_order_items enable row level security;

drop policy if exists demand_orders_select_by_role_scope on public.demand_orders;
drop policy if exists demand_orders_insert_creator_or_admin on public.demand_orders;
drop policy if exists demand_orders_update_draft_owner_or_admin on public.demand_orders;
drop policy if exists demand_orders_update_submit_owner_or_admin on public.demand_orders;

drop policy if exists demand_order_items_select_by_order_scope on public.demand_order_items;
drop policy if exists demand_order_items_insert_draft_owner_or_admin on public.demand_order_items;
drop policy if exists demand_order_items_update_draft_owner_or_admin on public.demand_order_items;
drop policy if exists demand_order_items_delete_draft_owner_or_admin on public.demand_order_items;

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
          actor_role.slug in ('admin', 'hos')
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

create policy demand_orders_insert_creator_or_admin
  on public.demand_orders
  for insert
  to authenticated
  with check (
    demand_orders.status = 'draft'
    and demand_orders.submitted_at is null
    and demand_orders.total_amount = 0
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      join public.profiles owner_profile on owner_profile.id = demand_orders.created_by_user_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and owner_profile.organization_id = demand_orders.organization_id
        and exists (
          select 1
          from public.parties p
          where p.id = demand_orders.party_id
            and p.organization_id = demand_orders.organization_id
        )
        and (
          (
            actor_role.slug = 'marketer'
            and demand_orders.created_by_user_id = actor.id
          )
          or actor_role.slug = 'admin'
        )
    )
  );

create policy demand_orders_update_draft_owner_or_admin
  on public.demand_orders
  for update
  to authenticated
  using (
    demand_orders.status = 'draft'
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and demand_orders.created_by_user_id = actor.id
          )
        )
    )
  )
  with check (
    demand_orders.status = 'draft'
    and demand_orders.submitted_at is null
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and demand_orders.created_by_user_id = actor.id
          )
        )
    )
    and exists (
      select 1
      from public.parties p
      where p.id = demand_orders.party_id
        and p.organization_id = demand_orders.organization_id
    )
  );

create policy demand_orders_update_submit_owner_or_admin
  on public.demand_orders
  for update
  to authenticated
  using (
    demand_orders.status = 'draft'
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and demand_orders.created_by_user_id = actor.id
          )
        )
    )
  )
  with check (
    demand_orders.status = 'submitted'
    and demand_orders.submitted_at is not null
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and demand_orders.created_by_user_id = actor.id
          )
        )
    )
  );

-- Items: same draft editor as header; visibility follows parent order SELECT.
create policy demand_order_items_select_by_order_scope
  on public.demand_order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.demand_orders o
      where o.id = demand_order_items.demand_order_id
    )
  );

create policy demand_order_items_insert_draft_owner_or_admin
  on public.demand_order_items
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.demand_orders o
      join public.profiles actor on actor.id = auth.uid()
      join public.roles actor_role on actor_role.id = actor.role_id
      join public.products pr on pr.id = demand_order_items.product_id
      where o.id = demand_order_items.demand_order_id
        and o.organization_id = actor.organization_id
        and pr.organization_id = o.organization_id
        and o.status = 'draft'
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and o.created_by_user_id = actor.id
          )
        )
    )
  );

create policy demand_order_items_update_draft_owner_or_admin
  on public.demand_order_items
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.demand_orders o
      join public.profiles actor on actor.id = auth.uid()
      join public.roles actor_role on actor_role.id = actor.role_id
      join public.products pr on pr.id = demand_order_items.product_id
      where o.id = demand_order_items.demand_order_id
        and o.organization_id = actor.organization_id
        and pr.organization_id = o.organization_id
        and o.status = 'draft'
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and o.created_by_user_id = actor.id
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.demand_orders o
      join public.profiles actor on actor.id = auth.uid()
      join public.roles actor_role on actor_role.id = actor.role_id
      join public.products pr on pr.id = demand_order_items.product_id
      where o.id = demand_order_items.demand_order_id
        and o.organization_id = actor.organization_id
        and pr.organization_id = o.organization_id
        and o.status = 'draft'
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and o.created_by_user_id = actor.id
          )
        )
    )
  );

create policy demand_order_items_delete_draft_owner_or_admin
  on public.demand_order_items
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.demand_orders o
      join public.profiles actor on actor.id = auth.uid()
      join public.roles actor_role on actor_role.id = actor.role_id
      where o.id = demand_order_items.demand_order_id
        and o.organization_id = actor.organization_id
        and o.status = 'draft'
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and o.created_by_user_id = actor.id
          )
        )
    )
  );
