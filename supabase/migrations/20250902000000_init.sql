-- Schema v2 untuk Dinas Store

-- ============ PROVIDERS ============
create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz default now()
);

-- ============ KATEGORI ============
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz default now()
);

-- ============ PRODUK (v2) ============
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'pulsa' check (type in ('pulsa', 'paket_data', 'token_listrik', 'apps_premium')),
  provider_id uuid references public.providers(id) on delete set null,
  name text not null,
  slug text not null unique,
  nominal text,
  kuota text,
  masa_aktif text,
  harga_modal bigint not null default 0,
  harga_jual bigint not null default 0,
  harga_diskon bigint,
  description text,
  image_url text,
  stock integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- Migrasi dari skema lama (jika kolom lama masih ada)
do $$
begin
  -- rename price -> harga_jual
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'price'
  ) then
    alter table public.products rename column price to harga_jual;
  end if;

  -- rename discount_price -> harga_diskon
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'discount_price'
  ) then
    alter table public.products rename column discount_price to harga_diskon;
  end if;

  -- tambah kolom baru jika belum ada
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'type'
  ) then
    alter table public.products add column type text default 'pulsa' check (type in ('pulsa', 'paket_data', 'token_listrik', 'apps_premium'));
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'provider_id'
  ) then
    alter table public.products add column provider_id uuid references public.providers(id) on delete set null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'nominal'
  ) then
    alter table public.products add column nominal text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'kuota'
  ) then
    alter table public.products add column kuota text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'masa_aktif'
  ) then
    alter table public.products add column masa_aktif text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'harga_modal'
  ) then
    alter table public.products add column harga_modal bigint default 0;
  end if;
end $$;

-- ============ MULTI-KATEGORI (junction) ============
create table if not exists public.product_categories (
  product_id uuid references public.products(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);

-- Migrasi: pindah category_id lama ke junction
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'category_id'
  ) then
    insert into public.product_categories (product_id, category_id)
    select id, category_id from public.products
    where category_id is not null
    on conflict (product_id, category_id) do nothing;

    alter table public.products drop column category_id;
  end if;
end $$;

-- ============ PROFIL USER ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz default now()
);

-- Trigger: buat profil otomatis saat user daftar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============ RLS ============
alter table public.providers enable row level security;
alter table public.products enable row level security;
alter table public.product_categories enable row level security;
alter table public.categories enable row level security;
alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Publik boleh baca (kecuali harga_modal)
drop policy if exists "public read categories" on public.categories;
create policy "public read categories"
  on public.categories for select using (true);

drop policy if exists "public read providers" on public.providers;
create policy "public read providers"
  on public.providers for select using (true);

drop policy if exists "public read products" on public.products;
create policy "public read products"
  on public.products for select using (is_active = true);

drop policy if exists "public read product_categories" on public.product_categories;
create policy "public read product_categories"
  on public.product_categories for select using (true);

-- Admin menulis
drop policy if exists "admin write providers" on public.providers;
create policy "admin write providers"
  on public.providers for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin write products" on public.products;
create policy "admin write products"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin write product_categories" on public.product_categories;
create policy "admin write product_categories"
  on public.product_categories for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin write categories" on public.categories;
create policy "admin write categories"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- Profil
drop policy if exists "profiles read self" on public.profiles;
create policy "profiles read self"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- ============ KEAMANAN (RLS sudah mengatur akses) ============
-- Kami tidak membatasi kolom harga_modal secara column-level karena
-- RLS memungkinkan admin (row-level) membaca semua kolom.
-- Jika ingin melindungi harga_modal dari publik, gunakan:
-- GRANT SELECT (id, type, ..., is_active, created_at) to anon;
-- Tapi untuk sekarang kami biarkan RLS yang mengatur.

-- ============ STORAGE ============
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images"
  on storage.objects for select
  using (bucket_id = 'products');

drop policy if exists "admin upload product images" on storage.objects;
create policy "admin upload product images"
  on storage.objects for insert
  with check (bucket_id = 'products' and public.is_admin());

drop policy if exists "admin delete product images" on storage.objects;
create policy "admin delete product images"
  on storage.objects for delete
  using (bucket_id = 'products' and public.is_admin());

-- ============ SEED PROVIDER ============
insert into public.providers (name, slug) values
  ('Telkomsel', 'telkomsel'),
  ('XL', 'xl'),
  ('Indosat', 'indosat'),
  ('Axis', 'axis'),
  ('Tri', 'tri'),
  ('Smartfren', 'smartfren'),
  ('PLN', 'pln')
on conflict (slug) do nothing;

-- ============ SEED KATEGORI ============
insert into public.categories (name, slug) values
  ('Pulsa', 'pulsa'),
  ('Paket Data', 'paket-data'),
  ('Token Listrik', 'token-listrik'),
  ('Apps Premium', 'apps-premium')
on conflict (slug) do nothing;
