create table if not exists public.organization_join_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  requested_role_id uuid references public.roles(id) on delete set null,
  requested_branch_id uuid references public.branches(id) on delete set null,
  note text,
  status text not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_join_requests_status_chk
    check (status in ('pending', 'approved', 'rejected', 'cancelled'))
);

create index if not exists organization_join_requests_org_status_idx
  on public.organization_join_requests (organization_id, status, created_at desc);

create index if not exists organization_join_requests_user_created_idx
  on public.organization_join_requests (user_id, created_at desc);

drop trigger if exists set_organization_join_requests_updated_at on public.organization_join_requests;
create trigger set_organization_join_requests_updated_at
before update on public.organization_join_requests
for each row execute function public.set_updated_at();

alter table public.organization_join_requests enable row level security;

create policy organization_join_requests_select_own
on public.organization_join_requests
for select
to authenticated
using (auth.uid() = user_id);
