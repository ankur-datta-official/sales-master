create table if not exists public.collection_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  party_id uuid not null references public.parties(id) on delete restrict,
  entry_date date not null,
  amount numeric(18, 2) not null,
  remarks text not null default '',
  verification_status text not null default 'unverified',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collection_entries_verification_status_chk
    check (verification_status in ('unverified', 'verified', 'rejected')),
  constraint collection_entries_amount_positive_chk
    check (amount > 0)
);

create index if not exists collection_entries_org_user_idx
  on public.collection_entries (organization_id, user_id);

create index if not exists collection_entries_org_entry_date_idx
  on public.collection_entries (organization_id, entry_date desc);

create index if not exists collection_entries_org_party_idx
  on public.collection_entries (organization_id, party_id);

create index if not exists collection_entries_org_verification_idx
  on public.collection_entries (organization_id, verification_status);

drop trigger if exists set_collection_entries_updated_at on public.collection_entries;
create trigger set_collection_entries_updated_at
before update on public.collection_entries
for each row
execute function public.set_updated_at();

alter table public.collection_entries enable row level security;

drop policy if exists collection_entries_select_by_role_scope on public.collection_entries;
drop policy if exists collection_entries_insert_marketer_self_or_admin on public.collection_entries;
drop policy if exists collection_entries_update_owner_recent on public.collection_entries;
drop policy if exists collection_entries_update_admin on public.collection_entries;
drop policy if exists collection_entries_review_accounts on public.collection_entries;

create policy collection_entries_select_by_role_scope
  on public.collection_entries
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = collection_entries.organization_id
        and (
          actor_role.slug in ('admin', 'hos', 'accounts')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and (
              collection_entries.user_id = actor.id
              or exists (
                select 1
                from public.get_subordinate_profile_ids(actor.id, false, 25) s
                where s.profile_id = collection_entries.user_id
              )
            )
          )
          or (
            actor_role.slug = 'marketer'
            and collection_entries.user_id = actor.id
          )
        )
    )
  );

create policy collection_entries_insert_marketer_self_or_admin
  on public.collection_entries
  for insert
  to authenticated
  with check (
    collection_entries.created_by = auth.uid()
    and collection_entries.verification_status = 'unverified'
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      join public.profiles collector on collector.id = collection_entries.user_id
      where actor.id = auth.uid()
        and actor.organization_id = collection_entries.organization_id
        and collector.organization_id = collection_entries.organization_id
        and exists (
          select 1
          from public.parties p
          where p.id = collection_entries.party_id
            and p.organization_id = collection_entries.organization_id
        )
        and (
          (
            actor_role.slug = 'marketer'
            and collection_entries.user_id = actor.id
          )
          or actor_role.slug = 'admin'
        )
    )
  );

-- Owner may correct recent unverified entries (72 hours from created_at)
create policy collection_entries_update_owner_recent
  on public.collection_entries
  for update
  to authenticated
  using (
    collection_entries.user_id = auth.uid()
    and collection_entries.created_at > (now() - interval '72 hours')
    and collection_entries.verification_status = 'unverified'
  )
  with check (
    collection_entries.user_id = auth.uid()
    and collection_entries.created_at > (now() - interval '72 hours')
    and collection_entries.verification_status = 'unverified'
    and exists (
      select 1
      from public.parties p
      where p.id = collection_entries.party_id
        and p.organization_id = collection_entries.organization_id
    )
  );

create policy collection_entries_update_admin
  on public.collection_entries
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = collection_entries.organization_id
        and actor_role.slug = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = collection_entries.organization_id
        and actor_role.slug = 'admin'
    )
    and exists (
      select 1
      from public.parties p
      where p.id = collection_entries.party_id
        and p.organization_id = collection_entries.organization_id
    )
    and exists (
      select 1
      from public.profiles collector
      where collector.id = collection_entries.user_id
        and collector.organization_id = collection_entries.organization_id
    )
    and collection_entries.verification_status in ('unverified', 'verified', 'rejected')
  );

-- Accounts (and admin via separate policy): move unverified -> verified/rejected.
-- App should send only verification_status; RLS mirrors work_reports review shape.
create policy collection_entries_review_accounts
  on public.collection_entries
  for update
  to authenticated
  using (
    collection_entries.verification_status = 'unverified'
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = collection_entries.organization_id
        and actor_role.slug = 'accounts'
    )
  )
  with check (
    collection_entries.verification_status in ('verified', 'rejected')
  );
