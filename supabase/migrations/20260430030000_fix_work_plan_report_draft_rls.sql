-- Tighten draft update RLS so marketers (and admins) cannot jump draft -> approved/rejected
-- in one update. Only draft content edits or draft -> submitted (with submitted_at) are allowed.

drop policy if exists work_plans_update_draft_owner_or_admin on public.work_plans;

create policy work_plans_update_draft_owner_or_admin
  on public.work_plans
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = work_plans.organization_id
        and work_plans.status = 'draft'
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and work_plans.owner_user_id = actor.id
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = work_plans.organization_id
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and work_plans.owner_user_id = actor.id
          )
        )
    )
    and (
      work_plans.status = 'draft'
      or (
        work_plans.status = 'submitted'
        and work_plans.submitted_at is not null
      )
    )
  );

drop policy if exists work_reports_update_draft_owner_or_admin on public.work_reports;

create policy work_reports_update_draft_owner_or_admin
  on public.work_reports
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = work_reports.organization_id
        and work_reports.status = 'draft'
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and work_reports.owner_user_id = actor.id
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = work_reports.organization_id
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and work_reports.owner_user_id = actor.id
          )
        )
    )
    and (
      work_reports.status = 'draft'
      or (
        work_reports.status = 'submitted'
        and work_reports.submitted_at is not null
      )
    )
  );
