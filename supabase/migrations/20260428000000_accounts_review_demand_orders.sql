-- Demand order pipeline stage + accounts review + sent_to_factory status.

alter table public.demand_orders add column if not exists stage text not null default 'draft';

alter table public.demand_orders drop constraint if exists demand_orders_stage_chk;
alter table public.demand_orders add constraint demand_orders_stage_chk
  check (stage in ('draft', 'manager_review', 'accounts_review', 'factory_queue'));

update public.demand_orders
set stage = case
  when status = 'draft' then 'draft'
  when status = 'rejected' then 'manager_review'
  when status = 'approved' then 'accounts_review'
  when status = 'sent_to_factory' then 'factory_queue'
  else 'manager_review'
end;

alter table public.demand_orders drop constraint if exists demand_orders_status_chk;
alter table public.demand_orders add constraint demand_orders_status_chk
  check (status in ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'sent_to_factory'));

create index if not exists demand_orders_org_stage_status_idx
  on public.demand_orders (organization_id, stage, status);

-- SELECT: org-wide for admin, hos, accounts (queue visibility).
drop policy if exists demand_orders_select_by_role_scope on public.demand_orders;
create policy demand_orders_select_by_role_scope
  on public.demand_orders
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug in ('admin', 'hos', 'accounts')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and (
              demand_orders.created_by_user_id = actor.id
              or exists (
                select 1
                from public.get_subordinate_profile_ids(actor.id, false, 25) s
                where s.profile_id = demand_orders.created_by_user_id
              )
            )
          )
          or (
            actor_role.slug = 'marketer'
            and demand_orders.created_by_user_id = actor.id
          )
        )
    )
  );

-- INSERT draft: stage must stay draft.
drop policy if exists demand_orders_insert_creator_or_admin on public.demand_orders;
create policy demand_orders_insert_creator_or_admin
  on public.demand_orders
  for insert
  to authenticated
  with check (
    demand_orders.status = 'draft'
    and demand_orders.stage = 'draft'
    and demand_orders.submitted_at is null
    and demand_orders.total_amount = 0
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      join public.profiles owner_profile on owner_profile.id = demand_orders.created_by_user_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and owner_profile.organization_id = demand_orders.organization_id
        and exists (
          select 1
          from public.parties p
          where p.id = demand_orders.party_id
            and p.organization_id = demand_orders.organization_id
        )
        and (
          (
            actor_role.slug = 'marketer'
            and demand_orders.created_by_user_id = actor.id
          )
          or actor_role.slug = 'admin'
        )
    )
  );

-- Draft edit: keep draft + draft stage.
drop policy if exists demand_orders_update_draft_owner_or_admin on public.demand_orders;
create policy demand_orders_update_draft_owner_or_admin
  on public.demand_orders
  for update
  to authenticated
  using (
    demand_orders.status = 'draft'
    and demand_orders.stage = 'draft'
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and demand_orders.created_by_user_id = actor.id
          )
        )
    )
  )
  with check (
    demand_orders.status = 'draft'
    and demand_orders.stage = 'draft'
    and demand_orders.submitted_at is null
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and demand_orders.created_by_user_id = actor.id
          )
        )
    )
    and exists (
      select 1
      from public.parties p
      where p.id = demand_orders.party_id
        and p.organization_id = demand_orders.organization_id
    )
  );

-- Submit: move to manager_review stage.
drop policy if exists demand_orders_update_submit_owner_or_admin on public.demand_orders;
create policy demand_orders_update_submit_owner_or_admin
  on public.demand_orders
  for update
  to authenticated
  using (
    demand_orders.status = 'draft'
    and demand_orders.stage = 'draft'
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and demand_orders.created_by_user_id = actor.id
          )
        )
    )
  )
  with check (
    demand_orders.status = 'submitted'
    and demand_orders.stage = 'manager_review'
    and demand_orders.submitted_at is not null
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug = 'admin'
          or (
            actor_role.slug = 'marketer'
            and demand_orders.created_by_user_id = actor.id
          )
        )
    )
  );

-- Manager / HOS review (not accounts): approve -> status approved, stage accounts_review.
drop policy if exists demand_orders_review_approve on public.demand_orders;
create policy demand_orders_review_approve
  on public.demand_orders
  for update
  to authenticated
  using (
    demand_orders.status in ('submitted', 'under_review')
    and demand_orders.stage = 'manager_review'
    and demand_orders.created_by_user_id <> auth.uid()
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and exists (
              select 1
              from public.get_subordinate_profile_ids(actor.id, false, 25) s
              where s.profile_id = demand_orders.created_by_user_id
            )
          )
        )
        and actor_role.slug <> 'accounts'
    )
  )
  with check (
    demand_orders.status = 'approved'
    and demand_orders.stage = 'accounts_review'
    and demand_orders.created_by_user_id <> auth.uid()
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and exists (
              select 1
              from public.get_subordinate_profile_ids(actor.id, false, 25) s
              where s.profile_id = demand_orders.created_by_user_id
            )
          )
        )
        and actor_role.slug <> 'accounts'
    )
  );

drop policy if exists demand_orders_review_reject on public.demand_orders;
create policy demand_orders_review_reject
  on public.demand_orders
  for update
  to authenticated
  using (
    demand_orders.status in ('submitted', 'under_review')
    and demand_orders.stage = 'manager_review'
    and demand_orders.created_by_user_id <> auth.uid()
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and exists (
              select 1
              from public.get_subordinate_profile_ids(actor.id, false, 25) s
              where s.profile_id = demand_orders.created_by_user_id
            )
          )
        )
        and actor_role.slug <> 'accounts'
    )
  )
  with check (
    demand_orders.status = 'rejected'
    and demand_orders.stage = 'manager_review'
    and demand_orders.created_by_user_id <> auth.uid()
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and exists (
              select 1
              from public.get_subordinate_profile_ids(actor.id, false, 25) s
              where s.profile_id = demand_orders.created_by_user_id
            )
          )
        )
        and actor_role.slug <> 'accounts'
    )
  );

drop policy if exists demand_orders_review_forward_under_review on public.demand_orders;
create policy demand_orders_review_forward_under_review
  on public.demand_orders
  for update
  to authenticated
  using (
    demand_orders.status = 'submitted'
    and demand_orders.stage = 'manager_review'
    and demand_orders.created_by_user_id <> auth.uid()
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and exists (
              select 1
              from public.get_subordinate_profile_ids(actor.id, false, 25) s
              where s.profile_id = demand_orders.created_by_user_id
            )
          )
        )
        and actor_role.slug <> 'accounts'
    )
  )
  with check (
    demand_orders.status = 'under_review'
    and demand_orders.stage = 'manager_review'
    and demand_orders.created_by_user_id <> auth.uid()
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and (
          actor_role.slug in ('admin', 'hos')
          or (
            actor_role.slug in ('manager', 'assistant_manager')
            and exists (
              select 1
              from public.get_subordinate_profile_ids(actor.id, false, 25) s
              where s.profile_id = demand_orders.created_by_user_id
            )
          )
        )
        and actor_role.slug <> 'accounts'
    )
  );

-- Accounts (or admin): release to factory or reject.
drop policy if exists demand_orders_accounts_approve on public.demand_orders;
create policy demand_orders_accounts_approve
  on public.demand_orders
  for update
  to authenticated
  using (
    demand_orders.stage = 'accounts_review'
    and demand_orders.status = 'approved'
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and actor_role.slug in ('accounts', 'admin')
    )
  )
  with check (
    demand_orders.stage = 'factory_queue'
    and demand_orders.status = 'sent_to_factory'
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and actor_role.slug in ('accounts', 'admin')
    )
  );

drop policy if exists demand_orders_accounts_reject on public.demand_orders;
create policy demand_orders_accounts_reject
  on public.demand_orders
  for update
  to authenticated
  using (
    demand_orders.stage = 'accounts_review'
    and demand_orders.status = 'approved'
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and actor_role.slug in ('accounts', 'admin')
    )
  )
  with check (
    demand_orders.stage = 'manager_review'
    and demand_orders.status = 'rejected'
    and exists (
      select 1
      from public.profiles actor
      join public.roles actor_role on actor_role.id = actor.role_id
      where actor.id = auth.uid()
        and actor.organization_id = demand_orders.organization_id
        and actor_role.slug in ('accounts', 'admin')
    )
  );

-- Approval log actions for accounts.
alter table public.approval_logs drop constraint if exists approval_logs_action_chk;
alter table public.approval_logs add constraint approval_logs_action_chk
  check (action in (
    'submit',
    'approve',
    'reject',
    'forward',
    'accounts_approve',
    'accounts_reject'
  ));

drop policy if exists approval_logs_insert_accounts on public.approval_logs;
create policy approval_logs_insert_accounts
  on public.approval_logs
  for insert
  to authenticated
  with check (
    approval_logs.entity_type = 'demand_order'
    and approval_logs.action in ('accounts_approve', 'accounts_reject')
    and approval_logs.acted_by_user_id = auth.uid()
    and approval_logs.organization_id = (
      select p.organization_id from public.profiles p where p.id = auth.uid()
    )
    and exists (
      select 1
      from public.demand_orders o
      join public.profiles actor on actor.id = auth.uid()
      join public.roles actor_role on actor_role.id = actor.role_id
      where o.id = approval_logs.entity_id
        and o.organization_id = approval_logs.organization_id
        and actor.organization_id = o.organization_id
        and actor_role.slug in ('accounts', 'admin')
        and o.stage = 'accounts_review'
        and o.status = 'approved'
        and (
          (
            approval_logs.action = 'accounts_approve'
          )
          or (
            approval_logs.action = 'accounts_reject'
          )
        )
    )
  );
