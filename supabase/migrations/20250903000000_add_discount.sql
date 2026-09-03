-- Tambah kolom harga diskon (jalankan sekali di SQL Editor)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'discount_price'
  ) then
    alter table public.products add column discount_price bigint;
  end if;
end $$;
