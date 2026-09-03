export type Category = {
  id: string
  name: string
  slug: string
}

export type Provider = {
  id: string
  name: string
  slug: string
  created_at: string
}

export type Product = {
  id: string
  provider_id: string | null
  name: string
  slug: string
  nominal: string | null
  kuota: string | null
  masa_aktif: string | null
  harga_modal: number
  harga_jual: number
  harga_diskon: number | null
  description: string | null
  image_url: string | null
  sold: number
  is_active: boolean
  created_at: string
  providers?: Provider | null
  categories?: Category[]
}

export type BillStatus = 'pending' | 'approved' | 'rejected'

export type Bill = {
  id: string
  product_id: string
  quantity: number
  total_price: number
  status: BillStatus
  created_at: string
  approved_at: string | null
  products?: Pick<Product, 'id' | 'name' | 'image_url'> & {
    providers?: Provider | null
  } | null
}

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
}

export type ReportData = {
  modal: number
  omset: number
  keuntungan: number
  totalOrders: number
}

export type Profile = {
  id: string
  full_name: string | null
  role: 'admin' | 'user'
  created_at: string
}
