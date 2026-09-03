-- Hapus kolom type dari tabel products (tidak dipakai lagi)
alter table public.products drop column if exists type;
