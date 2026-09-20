-- ============ PACKAGE GROUPS ============
create table if not exists public.package_groups (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create unique index if not exists package_groups_provider_slug_unique
  on public.package_groups (provider_id, slug);

-- ============ PRODUCT PACKAGE_GROUP FK ============
alter table public.products
  add column if not exists package_group_id uuid references public.package_groups(id) on delete set null;

-- ============ DATA DUMMY ============
insert into public.package_groups (provider_id, name, slug, sort_order) values
  ((select id from public.providers where slug = 'xl'), 'Paket Malam', 'paket-malam', 1),
  ((select id from public.providers where slug = 'xl'), 'Paket Bulanan', 'paket-bulanan', 2),
  ((select id from public.providers where slug = 'xl'), 'Paket Roaming', 'paket-roaming', 3),
  ((select id from public.providers where slug = 'telkomsel'), 'Pulsa Malam', 'pulsa-malam', 1),
  ((select id from public.providers where slug = 'telkomsel'), 'Pulsa Reguler', 'pulsa-reguler', 2)
on conflict do nothing;

-- ============ RLS ============
alter table public.package_groups enable row level security;

drop policy if exists "public read package_groups" on public.package_groups;
create policy "public read package_groups"
  on public.package_groups for select using (true);

drop policy if exists "admin write package_groups" on public.package_groups;
create policy "admin write package_groups"
  on public.package_groups for all
  using (public.is_admin())
  with check (public.is_admin());