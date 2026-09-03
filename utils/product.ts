import { Product } from '@/types'

export const PUBLIC_PRODUCT_COLUMNS =
  'id,type,provider_id,name,slug,kuota,masa_aktif,harga_jual,harga_diskon,description,image_url,sold,is_active,created_at'

export function effectivePrice(p: Product): number {
  return p.harga_diskon &&
    p.harga_diskon > 0 &&
    p.harga_diskon < p.harga_jual
    ? p.harga_diskon
    : p.harga_jual
}

export function hasDiscount(p: Product): boolean {
  return p.harga_diskon != null && p.harga_diskon > 0 && p.harga_diskon < p.harga_jual
}

export function discountPercent(p: Product): number {
  if (!hasDiscount(p)) return 0
  return Math.round(((p.harga_jual - p.harga_diskon!) / p.harga_jual) * 100)
}

export function formatPrice(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`
}

export function productDataLabel(p: Product): string {
  if (p.type === 'paket_data' && p.kuota) return p.kuota
  if (p.masa_aktif) return p.masa_aktif
  return ''
}
