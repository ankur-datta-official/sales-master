create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assigned_to_user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  code text,
  contact_person text,
  phone text,
  email text,
  address text,
  notes text,
  status text not null default 'active',
  created_by_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parties_status_chk check (status in ('active', 'inactive'))
);

create unique index if not exists parties_org_code_unique_idx
  on public.parties (organization_id, code)
  where code is not null;

create index if not exists parties_org_assigned_idx
  on public.parties (organization_id, assigned_to_user_id);

create index if not exists parties_org_status_idx
  on public.parties (organization_id, status);

create index if not exists parties_org_name_idx
  on public.parties (organization_id, name);

drop trigger if exists set_parties_updated_at on public.parties;
create trigger set_parties_updated_at
before update on public.parties
for each row
execute function public.set_updated_at();

alter table public.parties enable row level security;

drop policy if exists parties_select_by_role_scope on public.parties;
drop policy if exists parties_insert_admin on public.parties;
drop policy if exists parties_update_admin on public.parties;

create policy parties_select_by_role_scope
  on public.parties
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = parties.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and (
              parties.assigned_to_user_id = actor.id
              or exists (
                select 1
                from public.get_subordinate_profile_ids(actor.id, false, 25) s
                where s.profile_id = parties.assigned_to_user_id
              )
            )
          )
          or (
            actor_role.slug = 'marketer'
            and parties.assigned_to_user_id = actor.id
          )
        )
    )
  );

create policy parties_insert_admin
  on public.parties
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor_role.slug = 'admin'
        and actor.organization_id = parties.organization_id
    )
  );

create policy parties_update_admin
  on public.parties
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor_role.slug = 'admin'
        and actor.organization_id = parties.organization_id
    )
  )
  with check (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor_role.slug = 'admin'
        and actor.organization_id = parties.organization_id
    )
  );
