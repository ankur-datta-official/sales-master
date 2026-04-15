create table if not exists public.sales_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  party_id uuid not null references public.parties(id) on delete restrict,
  entry_date date not null,
  amount numeric(18, 2) not null,
  quantity numeric(18, 4) not null default 0,
  remarks text not null default '',
  source text not null default 'manual',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_entries_source_chk
    check (source in ('manual')),
  constraint sales_entries_amount_positive_chk
    check (amount > 0),
  constraint sales_entries_quantity_nonnegative_chk
    check (quantity >= 0)
);

create index if not exists sales_entries_org_user_idx
  on public.sales_entries (organization_id, user_id);

create index if not exists sales_entries_org_entry_date_idx
  on public.sales_entries (organization_id, entry_date desc);

create index if not exists sales_entries_org_party_idx
  on public.sales_entries (organization_id, party_id);

drop trigger if exists set_sales_entries_updated_at on public.sales_entries;
create trigger set_sales_entries_updated_at
before update on public.sales_entries
for each row
execute function public.set_updated_at();

alter table public.sales_entries enable row level security;

drop policy if exists sales_entries_select_by_role_scope on public.sales_entries;
drop policy if exists sales_entries_insert_marketer_self_or_admin on public.sales_entries;
drop policy if exists sales_entries_update_owner_recent on public.sales_entries;
drop policy if exists sales_entries_update_admin on public.sales_entries;

create policy sales_entries_select_by_role_scope
  on public.sales_entries
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = sales_entries.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and (
              sales_entries.user_id = actor.id
              or exists (
                select 1
                from public.get_subordinate_profile_ids(actor.id, false, 25) s
                where s.profile_id = sales_entries.user_id
              )
            )
          )
          or (
            actor_role.slug = 'marketer'
            and sales_entries.user_id = actor.id
          )
        )
    )
  );

create policy sales_entries_insert_marketer_self_or_admin
  on public.sales_entries
  for insert
  to authenticated
  with check (
    sales_entries.created_by = auth.uid()
    and sales_entries.source = 'manual'
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      join public.profiles seller on seller.id = sales_entries.user_id
      where actor.id = auth.uid()
        and actor.organization_id = sales_entries.organization_id
        and seller.organization_id = sales_entries.organization_id
        and exists (
          select 1
          from public.parties p
          where p.id = sales_entries.party_id
            and p.organization_id = sales_entries.organization_id
        )
        and (
          (
            actor_role.slug = 'marketer'
            and sales_entries.user_id = actor.id
          )
          or actor_role.slug = 'admin'
        )
    )
  );

-- Owner may correct recent entries (72 hours from created_at), v1 manual source only
create policy sales_entries_update_owner_recent
  on public.sales_entries
  for update
  to authenticated
  using (
    sales_entries.user_id = auth.uid()
    and sales_entries.created_at > (now() - interval '72 hours')
  )
  with check (
    sales_entries.user_id = auth.uid()
    and sales_entries.created_at > (now() - interval '72 hours')
    and sales_entries.source = 'manual'
    and exists (
      select 1
      from public.parties p
      where p.id = sales_entries.party_id
        and p.organization_id = sales_entries.organization_id
    )
  );

create policy sales_entries_update_admin
  on public.sales_entries
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = sales_entries.organization_id
        and actor_role.slug = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = sales_entries.organization_id
        and actor_role.slug = 'admin'
    )
    and sales_entries.source = 'manual'
    and exists (
      select 1
      from public.parties p
      where p.id = sales_entries.party_id
        and p.organization_id = sales_entries.organization_id
    )
    and exists (
      select 1
      from public.profiles seller
      where seller.id = sales_entries.user_id
        and seller.organization_id = sales_entries.organization_id
    )
  );
