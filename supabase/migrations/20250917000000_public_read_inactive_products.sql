-- Publik boleh baca semua produk, termasuk yang nonaktif (ditandai Close di UI)
drop policy if exists "public read products" on public.products;
create policy "public read products"
  on public.products for select using (true);
