create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_slug_lower_chk check (slug = lower(slug)),
  constraint organizations_slug_format_chk check (slug ~ '^[a-z0-9]+(?:[-_][a-z0-9]+)*$'),
  constraint organizations_status_chk check (status in ('active', 'inactive', 'suspended')),
  constraint organizations_slug_key unique (slug)
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text not null,
  is_head_office boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint branches_status_chk check (status in ('active', 'inactive', 'closed')),
  constraint branches_code_unique unique (organization_id, code),
  constraint branches_name_unique unique (organization_id, name)
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  level integer not null,
  description text,
  is_system boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_slug_lower_chk check (slug = lower(slug)),
  constraint roles_slug_format_chk check (slug ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  constraint roles_level_chk check (level >= 0),
  constraint roles_status_chk check (status in ('active', 'inactive'))
);

create unique index if not exists roles_global_slug_unique_idx
  on public.roles (slug)
  where organization_id is null;

create unique index if not exists roles_org_slug_unique_idx
  on public.roles (organization_id, slug)
  where organization_id is not null;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete restrict,
  branch_id uuid references public.branches(id) on delete set null,
  role_id uuid references public.roles(id) on delete restrict,
  reports_to_user_id uuid references public.profiles(id) on delete set null,
  full_name text,
  email text,
  phone text,
  employee_code text,
  designation text,
  avatar_url text,
  is_field_user boolean not null default false,
  status text not null default 'invited',
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists organization_id uuid,
  add column if not exists branch_id uuid,
  add column if not exists role_id uuid,
  add column if not exists reports_to_user_id uuid,
  add column if not exists phone text,
  add column if not exists employee_code text,
  add column if not exists designation text,
  add column if not exists is_field_user boolean not null default false,
  add column if not exists status text not null default 'invited',
  add column if not exists joined_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_organization_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_organization_id_fkey
      foreign key (organization_id) references public.organizations(id) on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_branch_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_branch_id_fkey
      foreign key (branch_id) references public.branches(id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_id_fkey
      foreign key (role_id) references public.roles(id) on delete restrict;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_reports_to_user_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_reports_to_user_id_fkey
      foreign key (reports_to_user_id) references public.profiles(id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_status_chk'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_status_chk
      check (status in ('invited', 'active', 'inactive', 'suspended'));
  end if;
end
$$;

create unique index if not exists profiles_org_employee_code_unique_idx
  on public.profiles (organization_id, employee_code)
  where employee_code is not null;

create index if not exists branches_organization_id_idx
  on public.branches (organization_id);

create index if not exists roles_organization_id_idx
  on public.roles (organization_id);

create index if not exists profiles_organization_id_idx
  on public.profiles (organization_id);

create index if not exists profiles_role_id_idx
  on public.profiles (role_id);

create index if not exists profiles_reports_to_user_id_idx
  on public.profiles (reports_to_user_id);

create index if not exists profiles_branch_id_idx
  on public.profiles (branch_id);

create index if not exists profiles_status_idx
  on public.profiles (status);

drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();

drop trigger if exists set_branches_updated_at on public.branches;
create trigger set_branches_updated_at
before update on public.branches
for each row
execute function public.set_updated_at();

drop trigger if exists set_roles_updated_at on public.roles;
create trigger set_roles_updated_at
before update on public.roles
for each row
execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

insert into public.roles (name, slug, level, is_system, status)
values
  ('Admin', 'admin', 100, true, 'active'),
  ('Head of Sales', 'hos', 90, true, 'active'),
  ('Manager', 'manager', 70, true, 'active'),
  ('Assistant Manager', 'assistant_manager', 60, true, 'active'),
  ('Marketer', 'marketer', 40, true, 'active'),
  ('Accounts', 'accounts', 50, true, 'active'),
  ('Factory Operator', 'factory_operator', 30, true, 'active')
on conflict do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    status
  )
  values (
    new.id,
    lower(new.email),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'avatar_url',
    'invited'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
