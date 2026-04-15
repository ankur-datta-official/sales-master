-- Attendance sessions: one open (checked-in) session per user at a time.

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  check_in_at timestamptz not null default now(),
  check_in_lat double precision,
  check_in_lng double precision,
  check_in_address text,
  check_out_at timestamptz,
  check_out_lat double precision,
  check_out_lng double precision,
  check_out_address text,
  status text not null default 'checked_in',
  device_info text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_sessions_status_chk
    check (status in ('checked_in', 'checked_out', 'missed_checkout')),
  constraint attendance_sessions_checked_in_open_chk
    check (
      status <> 'checked_in'
      or check_out_at is null
    ),
  constraint attendance_sessions_checked_out_times_chk
    check (
      status <> 'checked_out'
      or (
        check_out_at is not null
        and check_out_at >= check_in_at
      )
    )
);

create unique index if not exists attendance_sessions_one_open_per_user_idx
  on public.attendance_sessions (user_id)
  where (status = 'checked_in');

create index if not exists attendance_sessions_org_user_check_in_idx
  on public.attendance_sessions (organization_id, user_id, check_in_at desc);

create index if not exists attendance_sessions_org_check_in_idx
  on public.attendance_sessions (organization_id, check_in_at desc);

drop trigger if exists set_attendance_sessions_updated_at on public.attendance_sessions;
create trigger set_attendance_sessions_updated_at
before update on public.attendance_sessions
for each row
execute function public.set_updated_at();

alter table public.attendance_sessions enable row level security;

drop policy if exists attendance_sessions_select_by_role_scope on public.attendance_sessions;
drop policy if exists attendance_sessions_insert_self_roles on public.attendance_sessions;
drop policy if exists attendance_sessions_update_checkout_self on public.attendance_sessions;

create policy attendance_sessions_select_by_role_scope
  on public.attendance_sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = attendance_sessions.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and (
              attendance_sessions.user_id = actor.id
              or exists (
                select 1
                from public.get_subordinate_profile_ids(actor.id, false, 25) s
                where s.profile_id = attendance_sessions.user_id
              )
            )
          )
          or (
            actor_role.slug in ('marketer', 'accounts', 'factory_operator')
            and attendance_sessions.user_id = actor.id
          )
        )
    )
  );

create policy attendance_sessions_insert_self_roles
  on public.attendance_sessions
  for insert
  to authenticated
  with check (
    attendance_sessions.user_id = auth.uid()
    and attendance_sessions.status = 'checked_in'
    and attendance_sessions.check_out_at is null
    and not exists (
      select 1
      from public.attendance_sessions s
      where s.user_id = auth.uid()
        and s.status = 'checked_in'
    )
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      join public.profiles owner on owner.id = attendance_sessions.user_id
      where actor.id = auth.uid()
        and actor.organization_id = attendance_sessions.organization_id
        and owner.organization_id = attendance_sessions.organization_id
        and owner.id = actor.id
        and actor_role.slug in (
          'admin',
          'hos',
          'manager',
          'assistant_manager',
          'marketer',
          'accounts',
          'factory_operator'
        )
    )
  );

create policy attendance_sessions_update_checkout_self
  on public.attendance_sessions
  for update
  to authenticated
  using (
    attendance_sessions.user_id = auth.uid()
    and attendance_sessions.status = 'checked_in'
    and attendance_sessions.check_out_at is null
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = attendance_sessions.organization_id
        and actor_role.slug in (
          'admin',
          'hos',
          'manager',
          'assistant_manager',
          'marketer',
          'accounts',
          'factory_operator'
        )
    )
  )
  with check (
    attendance_sessions.user_id = auth.uid()
    and attendance_sessions.status = 'checked_out'
    and attendance_sessions.check_out_at is not null
    and attendance_sessions.check_out_at >= attendance_sessions.check_in_at
    and attendance_sessions.organization_id = (
      select p.organization_id from public.profiles p where p.id = auth.uid()
    )
  );

grant select, insert, update on public.attendance_sessions to authenticated;
