-- Migrasi: stock -> sold + tabel bills + trigger auto tambah jumlah terjual

-- ============ RENAME stock -> sold ============
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'stock'
  ) then
    alter table public.products rename column stock to sold;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'sold'
  ) then
    alter table public.products add column sold integer not null default 0;
  end if;
end $$;

-- ============ TABEL BILLS ============
create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  total_price bigint not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  approved_at timestamptz
);

-- ============ TRIGGER: tambah sold saat bill di-approve ============
create or replace function public.increment_sold_on_approve()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    update public.products
      set sold = coalesce(sold, 0) + new.quantity
      where id = new.product_id;
    new.approved_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_increment_sold_on_approve on public.bills;
create trigger trg_increment_sold_on_approve
  after update of status on public.bills
  for each row execute function public.increment_sold_on_approve();

-- ============ RLS ============
alter table public.bills enable row level security;

-- Publik boleh membuat bill (order) tanpa login
drop policy if exists "public insert bills" on public.bills;
create policy "public insert bills"
  on public.bills for insert
  with check (true);

-- Hanya admin yang melihat & mengubah status bill
drop policy if exists "admin read bills" on public.bills;
create policy "admin read bills"
  on public.bills for select
  using (public.is_admin());

drop policy if exists "admin update bills" on public.bills;
create policy "admin update bills"
  on public.bills for update
  using (public.is_admin())
  with check (public.is_admin());
