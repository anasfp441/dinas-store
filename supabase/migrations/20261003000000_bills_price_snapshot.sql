-- Migrasi: Simpan snapshot harga modal dan harga satuan di tabel bills
-- Menggunakan trigger agar data akurat saat transaksi dibuat

-- 1. Tambah kolom ke tabel bills
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bills' AND column_name = 'harga_modal') THEN
    ALTER TABLE public.bills ADD COLUMN harga_modal BIGINT NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bills' AND column_name = 'harga_satuan') THEN
    ALTER TABLE public.bills ADD COLUMN harga_satuan BIGINT NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 2. Backfill data lama (opsional, ambil dari harga produk saat ini)
UPDATE public.bills b
SET 
  harga_modal = p.harga_modal,
  harga_satuan = CASE 
    WHEN p.harga_diskon > 0 AND p.harga_diskon < p.harga_jual THEN p.harga_diskon 
    ELSE p.harga_jual 
  END
FROM public.products p
WHERE b.product_id = p.id
  AND b.harga_modal = 0;

-- 3. Trigger function untuk snapshot harga saat INSERT
CREATE OR REPLACE FUNCTION public.set_bill_price_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_modal BIGINT;
  v_jual BIGINT;
  v_diskon BIGINT;
  v_final_unit BIGINT;
BEGIN
  -- Ambil data harga terbaru dari produk
  SELECT harga_modal, harga_jual, harga_diskon 
  INTO v_modal, v_jual, v_diskon
  FROM public.products 
  WHERE id = NEW.product_id;

  -- Logika: Prioritas diskon jika ada dan valid
  IF v_diskon IS NOT NULL AND v_diskon > 0 AND v_diskon < v_jual THEN
    v_final_unit := v_diskon;
  ELSE
    v_final_unit := v_jual;
  END IF;

  -- Set nilai snapshot
  NEW.harga_modal := COALESCE(v_modal, 0);
  NEW.harga_satuan := COALESCE(v_final_unit, 0);
  NEW.total_price := COALESCE(v_final_unit, 0) * NEW.quantity;

  RETURN NEW;
END;
$$;

-- 4. Pasang trigger
DROP TRIGGER IF EXISTS trg_set_bill_price_snapshot ON public.bills;
CREATE TRIGGER trg_set_bill_price_snapshot
  BEFORE INSERT ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.set_bill_price_snapshot();
