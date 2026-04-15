-- Fix recursion in attendance insert policy.
-- Root cause: policy referenced attendance_sessions inside its own WITH CHECK.
-- Active-session uniqueness is already enforced by:
--   attendance_sessions_one_open_per_user_idx (partial unique index)

drop policy if exists attendance_sessions_insert_self_roles on public.attendance_sessions;

create policy attendance_sessions_insert_self_roles
  on public.attendance_sessions
  for insert
  to authenticated
  with check (
    attendance_sessions.user_id = auth.uid()
    and attendance_sessions.status = 'checked_in'
    and attendance_sessions.check_out_at is null
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
