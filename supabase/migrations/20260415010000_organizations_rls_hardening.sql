alter table public.organizations enable row level security;
alter table public.organizations force row level security;

drop policy if exists organizations_select_own on public.organizations;

create policy organizations_select_own
  on public.organizations
  for select
  to authenticated
  using (
    id = (
      select p.organization_id
      from public.profiles p
      where p.id = auth.uid()
    )
  );

grant select on public.organizations to authenticated;
