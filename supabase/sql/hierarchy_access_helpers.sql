-- Hierarchy traversal and access-check helpers for Sales Master WebApp v1.
-- Assumes the base schema includes:
--   public.organizations
--   public.branches
--   public.roles
--   public.profiles
-- with public.profiles.reports_to_user_id and public.profiles.role_id present.

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

comment on function public.get_subordinate_profile_ids(uuid, boolean, integer)
is 'Returns all descendant profile ids for a manager/root profile using reports_to_user_id. Role level does not expand access by itself.';

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
      when (select organization_id from actor) <> (select organization_id from target) then 'different_organization'
      when (select id from actor) = (select id from target) then 'self'
      when (select is_subordinate from subordinate_match) then 'subordinate'
      when p_has_org_wide_access then 'explicit_org_scope'
      else 'outside_tree'
    end as access_reason
  ;
$$;

comment on function public.can_access_profile(uuid, uuid, boolean, integer)
is 'Checks profile access using same-organization plus self/subordinate tree logic. Cross-tree access must be passed in explicitly.';

-- Example 1: ad-hoc recursive query to fetch subordinate ids for one profile.
--
-- with recursive hierarchy as (
--   select p.id, p.organization_id, 0 as depth, array[p.id]::uuid[] as path
--   from public.profiles p
--   where p.id = :root_profile_id
--
--   union all
--
--   select child.id, child.organization_id, hierarchy.depth + 1, hierarchy.path || child.id
--   from public.profiles child
--   join hierarchy
--     on child.reports_to_user_id = hierarchy.id
--    and child.organization_id = hierarchy.organization_id
--   where hierarchy.depth < 25
--     and not child.id = any(hierarchy.path)
-- )
-- select id
-- from hierarchy
-- where depth > 0;

-- Example 2: query pattern for app-side access checks.
--
-- select *
-- from public.can_access_profile(
--   :actor_profile_id,
--   :target_profile_id,
--   :has_org_wide_access
-- );
--
-- Notes:
-- - :has_org_wide_access should come from an explicit permission grant in the app layer.
-- - Do not infer unrelated-tree access only from role level.

-- Example 3: subtree-scoped list query for dashboards or reports.
--
-- select p.*
-- from public.profiles p
-- where p.organization_id = :actor_organization_id
--   and (
--     p.id = :actor_profile_id
--     or p.id in (
--       select s.profile_id
--       from public.get_subordinate_profile_ids(:actor_profile_id, false, 25) s
--     )
--   )
-- order by p.full_name;

-- Recommended hierarchy approach:
-- 1. Use reports_to_user_id as the source of truth for access traversal.
-- 2. Use roles.level for display, approval precedence, and validation only.
-- 3. Suggested reporting chain:
--      hos -> manager -> assistant_manager -> marketer
--    Other roles such as accounts or factory_operator can be attached where the business needs them,
--    but access still flows from the reporting tree, not from role level alone.
-- 4. For 100+ users, the indexed reports_to_user_id recursive query is sufficient.
--    If the tree grows much larger or is queried very frequently, consider a closure table later.
