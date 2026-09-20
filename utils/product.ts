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

export function parseKuotaNumber(kuota: string): number {
  if (!kuota) return 0
  const text = kuota.toLowerCase()
  const num = parseFloat(text.replace(/[^\d.]/g, '')) || 0
  if (text.includes('mb') && !text.includes('gb')) return num / 1024
  return num
}

export function getKuotaRange(k: number): string {
  if (k <= 10) return '1GB-10GB'
  if (k <= 25) return '11GB-25GB'
  if (k <= 50) return '26GB-50GB'
  if (k <= 100) return '51GB-100GB'
  return '>100GB'
}

export function kuotaInRange(product: Product, range: string): boolean {
  if (range === 'all') return true
  if (!product.kuota) return false
  const k = parseKuotaNumber(product.kuota)
  if (k <= 0) return false
  return getKuotaRange(k) === range
}

export function priceInRange(product: Product, range: string): boolean {
  if (range === 'all') return true
  if (!product.harga_jual) return false
  const [minStr, maxStr] = range.split('-')
  const min = Number(minStr)
  const max = Number(maxStr)
  return product.harga_jual >= min && product.harga_jual <= max
}

export const PRICE_RANGES = [
  { value: 'all', label: 'Semua Harga' },
  { value: '0-15000', label: '< 15k' },
  { value: '15001-30000', label: '15k - 30k' },
  { value: '30001-50000', label: '30k - 50k' },
  { value: '50001-100000', label: '50k - 100k' },
  { value: '100001-250000', label: '100k - 250k' },
  { value: '250001-500000', label: '250k - 500k' },
  { value: '500001-999999', label: '500k - 1JT' },
  { value: '1000000-9999999', label: '> 1 JT' },
]

export const KUOTA_RANGES = [
  { value: '1GB-10GB', label: '1 GB - 10 GB' },
  { value: '11GB-25GB', label: '11 GB - 25 GB' },
  { value: '26GB-50GB', label: '26 GB - 50 GB' },
  { value: '51GB-100GB', label: '51 GB - 100 GB' },
  { value: '>100GB', label: '> 100 GB' },
]
