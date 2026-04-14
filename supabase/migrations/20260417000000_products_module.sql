create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_name text not null,
  item_code text not null,
  unit text not null,
  base_price numeric(12, 2) not null default 0,
  category text,
  description text,
  status text not null default 'active',
  created_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_status_chk check (status in ('active', 'inactive')),
  constraint products_base_price_chk check (base_price >= 0)
);

create unique index if not exists products_org_item_code_unique_idx
  on public.products (organization_id, item_code);

create index if not exists products_org_status_idx
  on public.products (organization_id, status);

create index if not exists products_org_name_idx
  on public.products (organization_id, product_name);

create index if not exists products_org_category_idx
  on public.products (organization_id, category);

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

alter table public.products enable row level security;

drop policy if exists products_select_org_scope on public.products;
drop policy if exists products_insert_admin on public.products;
drop policy if exists products_update_admin on public.products;

create policy products_select_org_scope
  on public.products
  for select
  to authenticated
  using (
    organization_id in (
      select p.organization_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );

create policy products_insert_admin
  on public.products
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor_role.slug = 'admin'
        and actor.organization_id = products.organization_id
    )
  );

create policy products_update_admin
  on public.products
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor_role.slug = 'admin'
        and actor.organization_id = products.organization_id
    )
  )
  with check (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor_role.slug = 'admin'
        and actor.organization_id = products.organization_id
    )
  );
