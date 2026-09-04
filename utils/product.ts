import { Product } from '@/types'

export const PUBLIC_PRODUCT_COLUMNS =
  'id,provider_id,name,slug,nominal,kuota,masa_aktif,harga_jual,harga_diskon,description,image_url,sold,is_active,created_at'

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
  if (p.kuota) return `${p.kuota} GB`
  if (p.masa_aktif) return `${p.masa_aktif} Hari`
  return ''
}

export function sortProductsNumerically(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const numA = parseInt(a.name.replace(/\D/g, ''), 10) || 0
    const numB = parseInt(b.name.replace(/\D/g, ''), 10) || 0
    if (numA !== numB) {
      return numA - numB
    }
    return a.name.localeCompare(b.name)
  })
}
