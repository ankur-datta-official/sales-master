-- Hierarchy RPCs (from supabase/sql/hierarchy_access_helpers.sql) + profiles RLS for org + reporting tree.

create or replace function public.get_subordinate_profile_ids(
  p_root_profile_id uuid,
  p_include_self boolean default false,
  p_max_depth integer default 25
)
returns table (
  profile_id uuid,
  depth integer
)
language sql
stable
security invoker
set search_path = public
as $$
  with recursive hierarchy as (
    select
      p.id as profile_id,
      p.organization_id,
      0::integer as depth,
      array[p.id]::uuid[] as path
    from public.profiles p
    where p.id = p_root_profile_id

    union all

    select
      child.id as profile_id,
      child.organization_id,
      hierarchy.depth + 1 as depth,
      hierarchy.path || child.id
    from public.profiles child
    inner join hierarchy
      on child.reports_to_user_id = hierarchy.profile_id
     and child.organization_id = hierarchy.organization_id
    where hierarchy.depth < p_max_depth
      and not child.id = any(hierarchy.path)
  )
  select
    hierarchy.profile_id,
    hierarchy.depth
  from hierarchy
  where p_include_self or hierarchy.depth > 0
  order by hierarchy.depth, hierarchy.profile_id;
$$;

create or replace function public.can_access_profile(
  p_actor_profile_id uuid,
  p_target_profile_id uuid,
  p_has_org_wide_access boolean default false,
  p_max_depth integer default 25
)
returns table (
  can_access boolean,
  access_reason text
)
language sql
stable
security invoker
set search_path = public
as $$
  with actor as (
    select
      p.id,
      p.organization_id
    from public.profiles p
    where p.id = p_actor_profile_id
  ),
  target as (
    select
      p.id,
      p.organization_id
    from public.profiles p
    where p.id = p_target_profile_id
  ),
  subordinate_match as (
    select exists (
      select 1
      from public.get_subordinate_profile_ids(
        p_actor_profile_id,
        false,
        p_max_depth
      ) s
      where s.profile_id = p_target_profile_id
    ) as is_subordinate
  )
  select
    coalesce(
      (select organization_id from actor) = (select organization_id from target)
      and (
        (select id from actor) = (select id from target)
        or (select is_subordinate from subordinate_match)
        or p_has_org_wide_access
      ),
      false
    ) as can_access,
    case
      when not exists (select 1 from actor) then 'actor_not_found'
      when not exists (select 1 from target) then 'target_not_found'
      when (select organization_id from actor) is distinct from (select organization_id from target) then 'different_organization'
      when (select id from actor) = (select id from target) then 'self'
      when (select is_subordinate from subordinate_match) then 'subordinate'
      when p_has_org_wide_access then 'explicit_org_scope'
      else 'outside_tree'
    end as access_reason
  ;
$$;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

alter table public.profiles enable row level security;

create policy profiles_select_visible
  on public.profiles
  for select
  to authenticated
  using (
    id = auth.uid()
    or (
      organization_id is not null
      and exists (
        select 1
        from public.can_access_profile(
          auth.uid(),
          profiles.id,
          (
            select coalesce(bool_or(r.slug = 'admin'), false)
            from public.profiles ap
            inner join public.roles r on r.id = ap.role_id
            where ap.id = auth.uid()
              and ap.organization_id = profiles.organization_id
          )
        ) x
        where x.can_access = true
      )
    )
  );

create policy profiles_update_org_admin
  on public.profiles
  for update
  to authenticated
  using (
    organization_id is not null
    and exists (
      select 1
      from public.profiles ap
      inner join public.roles r on r.id = ap.role_id
      where ap.id = auth.uid()
        and r.slug = 'admin'
        and ap.organization_id = profiles.organization_id
    )
  )
  with check (
    organization_id is not null
    and exists (
      select 1
      from public.profiles ap
      inner join public.roles r on r.id = ap.role_id
      where ap.id = auth.uid()
        and r.slug = 'admin'
        and ap.organization_id = profiles.organization_id
    )
  );

alter table public.roles enable row level security;

drop policy if exists roles_read_org_and_global on public.roles;

create policy roles_read_org_and_global
  on public.roles
  for select
  to authenticated
  using (
    status = 'active'
    and (
      organization_id is null
      or organization_id in (
        select p.organization_id
        from public.profiles p
        where p.id = auth.uid()
      )
    )
  );

alter table public.branches enable row level security;

drop policy if exists branches_read_org on public.branches;

create policy branches_read_org
  on public.branches
  for select
  to authenticated
  using (
    organization_id in (
      select p.organization_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );
