create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'workflow',
  source_key text not null,
  title text not null,
  detail text not null default '',
  href text not null default '/notifications',
  source_entity_type text,
  source_entity_id uuid,
  tone text not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_key)
);

create index if not exists user_notifications_user_created_idx
  on public.user_notifications(user_id, created_at desc);

create index if not exists user_notifications_user_unread_idx
  on public.user_notifications(user_id, read_at, created_at desc);

create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  subject text not null,
  created_by_user_id uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, entity_type, entity_id)
);

create index if not exists message_threads_org_last_message_idx
  on public.message_threads(organization_id, last_message_at desc);

create table if not exists public.message_thread_participants (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  is_muted boolean not null default false,
  created_at timestamptz not null default now(),
  unique (thread_id, user_id)
);

create index if not exists message_thread_participants_user_idx
  on public.message_thread_participants(user_id, thread_id);

create table if not exists public.message_entries (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  message_type text not null default 'reply',
  source_key text unique,
  created_at timestamptz not null default now()
);

create index if not exists message_entries_thread_created_idx
  on public.message_entries(thread_id, created_at desc);

alter table public.user_notifications enable row level security;
alter table public.message_threads enable row level security;
alter table public.message_thread_participants enable row level security;
alter table public.message_entries enable row level security;

drop policy if exists "user_notifications_select_own" on public.user_notifications;
create policy "user_notifications_select_own"
  on public.user_notifications
  for select
  using (user_id = auth.uid());

drop policy if exists "user_notifications_update_own" on public.user_notifications;
create policy "user_notifications_update_own"
  on public.user_notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "message_threads_select_visible" on public.message_threads;
create policy "message_threads_select_visible"
  on public.message_threads
  for select
  using (
    exists (
      select 1
      from public.message_thread_participants participants
      where participants.thread_id = message_threads.id
        and participants.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles me
      where me.id = auth.uid()
        and me.organization_id = message_threads.organization_id
        and me.role in ('admin', 'hos', 'manager', 'assistant_manager')
    )
  );

drop policy if exists "message_threads_insert_own_org" on public.message_threads;
create policy "message_threads_insert_own_org"
  on public.message_threads
  for insert
  with check (
    created_by_user_id = auth.uid()
    and exists (
      select 1
      from public.profiles me
      where me.id = auth.uid()
        and me.organization_id = message_threads.organization_id
    )
  );

drop policy if exists "message_threads_update_visible" on public.message_threads;
create policy "message_threads_update_visible"
  on public.message_threads
  for update
  using (
    exists (
      select 1
      from public.message_thread_participants participants
      where participants.thread_id = message_threads.id
        and participants.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles me
      where me.id = auth.uid()
        and me.organization_id = message_threads.organization_id
        and me.role in ('admin', 'hos', 'manager', 'assistant_manager')
    )
  );

drop policy if exists "message_thread_participants_select_visible" on public.message_thread_participants;
create policy "message_thread_participants_select_visible"
  on public.message_thread_participants
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.message_threads threads
      join public.profiles me on me.id = auth.uid()
      where threads.id = message_thread_participants.thread_id
        and me.organization_id = threads.organization_id
        and me.role in ('admin', 'hos', 'manager', 'assistant_manager')
    )
  );

drop policy if exists "message_entries_select_visible" on public.message_entries;
create policy "message_entries_select_visible"
  on public.message_entries
  for select
  using (
    exists (
      select 1
      from public.message_threads threads
      left join public.message_thread_participants participants
        on participants.thread_id = threads.id and participants.user_id = auth.uid()
      left join public.profiles me
        on me.id = auth.uid()
      where threads.id = message_entries.thread_id
        and (
          participants.user_id is not null
          or (
            me.organization_id = threads.organization_id
            and me.role in ('admin', 'hos', 'manager', 'assistant_manager')
          )
        )
    )
  );

drop policy if exists "message_entries_insert_visible_sender" on public.message_entries;
create policy "message_entries_insert_visible_sender"
  on public.message_entries
  for insert
  with check (
    sender_user_id = auth.uid()
    and exists (
      select 1
      from public.message_threads threads
      left join public.message_thread_participants participants
        on participants.thread_id = threads.id and participants.user_id = auth.uid()
      left join public.profiles me
        on me.id = auth.uid()
      where threads.id = message_entries.thread_id
        and (
          participants.user_id is not null
          or (
            me.organization_id = threads.organization_id
            and me.role in ('admin', 'hos', 'manager', 'assistant_manager')
          )
        )
    )
  );
