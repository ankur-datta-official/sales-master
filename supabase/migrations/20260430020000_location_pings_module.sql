-- Field activity sampled location pings tied to active attendance sessions.

create table if not exists public.location_pings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  attendance_session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  captured_at timestamptz not null default now(),
  lat double precision not null,
  lng double precision not null,
  accuracy double precision,
  speed double precision,
  source text not null default 'web',
  created_at timestamptz not null default now(),
  constraint location_pings_lat_chk check (lat >= -90 and lat <= 90),
  constraint location_pings_lng_chk check (lng >= -180 and lng <= 180),
  constraint location_pings_accuracy_chk check (accuracy is null or accuracy >= 0),
  constraint location_pings_speed_chk check (speed is null or speed >= 0),
  constraint location_pings_source_chk check (source in ('web', 'mobile', 'manual', 'system'))
);

create index if not exists location_pings_session_captured_idx
  on public.location_pings (attendance_session_id, captured_at desc);

create index if not exists location_pings_user_captured_idx
  on public.location_pings (user_id, captured_at desc);

create index if not exists location_pings_org_captured_idx
  on public.location_pings (organization_id, captured_at desc);

alter table public.location_pings enable row level security;

drop policy if exists location_pings_select_by_scope on public.location_pings;
drop policy if exists location_pings_insert_active_session_self on public.location_pings;

create policy location_pings_select_by_scope
  on public.location_pings
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.attendance_sessions s
      join public.profiles actor on actor.id = auth.uid()
      join public.roles actor_role on actor_role.id = actor.role_id
      where s.id = location_pings.attendance_session_id
        and s.organization_id = location_pings.organization_id
        and actor.organization_id = location_pings.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and (
              s.user_id = actor.id
              or exists (
                select 1
                from public.get_subordinate_profile_ids(actor.id, false, 25) sub
                where sub.profile_id = s.user_id
              )
            )
          )
          or (
            actor_role.slug in ('marketer', 'accounts', 'factory_operator')
            and s.user_id = actor.id
          )
        )
    )
  );

create policy location_pings_insert_active_session_self
  on public.location_pings
  for insert
  to authenticated
  with check (
    location_pings.user_id = auth.uid()
    and location_pings.organization_id = (
      select p.organization_id from public.profiles p where p.id = auth.uid()
    )
    and exists (
      select 1
      from public.attendance_sessions s
      where s.id = location_pings.attendance_session_id
        and s.organization_id = location_pings.organization_id
        and s.user_id = auth.uid()
        and s.status = 'checked_in'
        and s.check_out_at is null
    )
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = location_pings.organization_id
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

grant select, insert on public.location_pings to authenticated;
