import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Category, Provider, ReportData } from '@/types'
import { ReportFilters } from '@/components/ReportFilters'
import { ReportSummary } from '@/components/ReportSummary'
import { formatPrice } from '@/utils/product'
import { ArrowUpDown } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getCategories(): Promise<Category[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('categories').select('*').order('name')
  return data || []
}

async function getProviders(): Promise<Provider[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('providers').select('*').order('name')
  return data || []
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const period = params.period || 'monthly'
  const startDate = params.startDate
  const endDate = params.endDate
  const categoryId = params.categoryId
  const providerId = params.providerId

  const supabase = await createSupabaseServerClient()

  // Debug: cek jumlah bill
  const { count: totalBills, error: countErr } = await supabase
    .from('bills')
    .select('*', { count: 'exact', head: true })
  if (countErr) console.error('Error count bills:', countErr.message)

  const { count: approvedBills, error: approvedErr } = await supabase
    .from('bills')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved')
  if (approvedErr) console.error('Error count approved:', approvedErr.message)

  const { count: pendingBills, error: pendingErr } = await supabase
    .from('bills')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
  if (pendingErr) console.error('Error count pending:', pendingErr.message)

  console.debug('Report: total bills', totalBills, 'approved', approvedBills, 'pending', pendingBills)

  const { data: rawBills, error: billErr } = await supabase
    .from('bills')
    .select('id, quantity, total_price, created_at, status, product_id')
    .eq('status', 'approved')
  if (billErr) console.error('Error fetching bills:', billErr.message)

  const { data: rawProducts, error: prodErr } = await supabase
    .from('products')
    .select('id, name, harga_modal, harga_jual, provider_id')
  if (prodErr) console.error('Error fetching products:', prodErr.message)

  // Ambil kategori produk lewat junction (products tak punya category_id langsung)
  const { data: productCats } = await supabase
    .from('product_categories')
    .select('product_id, category_id')

  const productCategoryMap: Record<string, string[]> = {}
  ;(productCats || []).forEach((pc: any) => {
    if (!productCategoryMap[pc.product_id]) productCategoryMap[pc.product_id] = []
    productCategoryMap[pc.product_id].push(pc.category_id)
  })

  const now = new Date()
  const bills = (rawBills || []).filter((b: any) => {
    const billDate = new Date(b.created_at)
    if (period === 'daily') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      if (billDate < start) return false
    } else if (period === 'weekly') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      if (billDate < start) return false
    } else if (period === 'monthly') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      if (billDate < start) return false
    } else if (period === 'yearly') {
      const start = new Date(now.getFullYear(), 0, 1)
      if (billDate < start) return false
    } else if (period === 'custom') {
      if (startDate) {
        const sd = new Date(startDate)
        if (billDate < sd) return false
      }
      if (endDate) {
        const ed = new Date(endDate)
        ed.setHours(23, 59, 59, 999)
        if (billDate > ed) return false
      }
    }
    return true
  })

  const productMap: Record<string, any> = {}
  ;(rawProducts || []).forEach((p: any) => {
    productMap[p.id] = p
  })

  let modal = 0
  let omset = 0
  const detailMap: Record<string, { name: string; qty: number; modal: number; omset: number }> = {}

  const filteredBills = bills.filter((b: any) => {
    const p = productMap[b.product_id]
    if (!p) return false
    if (categoryId && categoryId !== 'all') {
      const pCats = productCategoryMap[b.product_id] || []
      if (!pCats.includes(categoryId)) return false
    }
    if (providerId && providerId !== 'all' && p.provider_id !== providerId) return false
    return true
  })

  for (const b of filteredBills) {
    const p = productMap[b.product_id]
    if (!p) continue
    const qty = b.quantity || 1
    const m = (p.harga_modal || 0) * qty
    const o = (p.harga_jual || 0) * qty
    modal += m
    omset += o
    if (!detailMap[p.id]) {
      detailMap[p.id] = { name: p.name, qty: 0, modal: 0, omset: 0 }
    }
    detailMap[p.id].qty += qty
    detailMap[p.id].modal += m
    detailMap[p.id].omset += o
  }

  const keuntungan = omset - modal
  const summary: ReportData = { modal, omset, keuntungan, totalOrders: filteredBills.length }

  const details = Object.values(detailMap).sort((a, b) => b.omset - a.omset)

  const [categories, providers] = await Promise.all([getCategories(), getProviders()])

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Laporan Keuangan & Penjualan</h1>

      <ReportFilters categories={categories} providers={providers} />

      {totalBills === 0 ? (
        <div className="mb-8 bg-surface rounded-2xl border border-border p-6 text-center text-muted">
          Belum ada pesanan sama sekali di database.
        </div>
      ) : approvedBills === 0 ? (
        <div className="mb-8 bg-warning/10 border border-warning/30 rounded-2xl p-5">
          <p className="font-semibold text-warning">Belum ada pesanan berstatus Disetujui (approved)</p>
          <p className="text-sm text-muted mt-1">
            Laporan hanya menghitung bill yang di-approve. Ada {pendingBills ?? 0} pesanan menunggu —
            approve dulu di menu <b>Pesanan</b> agar masuk laporan.
          </p>
        </div>
      ) : null}

      <ReportSummary data={summary} />

      <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">Rincian Per Produk</h2>
          <p className="text-xs text-muted mt-0.5">Berdasarkan filter yang dipilih</p>
        </div>
        {details.length === 0 ? (
          <div className="p-12 text-center text-muted">
            Tidak ada data penjualan pada periode/filter ini
          </div>
        ) : (
          <>
            {/* Mobile view - Cards */}
            <div className="grid grid-cols-1 gap-3 p-5 md:hidden">
              {details.map((d, i) => {
                const profit = d.omset - d.modal
                return (
                  <div key={i} className="bg-surface-raised rounded-xl p-4 border border-border">
                    <h3 className="font-medium text-foreground text-sm">{d.name}</h3>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      <div>
                        <span className="text-muted">Terjual</span>
                        <span className="font-medium">{d.qty}</span>
                      </div>
                      <div>
                        <span className="text-muted">Modal</span>
                        <span className="font-mono text-muted">{formatPrice(d.modal)}</span>
                      </div>
                      <div>
                        <span className="text-muted">Omset</span>
                        <span className="font-mono text-foreground">{formatPrice(d.omset)}</span>
                      </div>
                      <div>
                        <span className="text-muted">Keuntungan</span>
                        <span className="font-mono text-success font-semibold">{formatPrice(profit)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop view - Table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="bg-surface-raised border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Produk</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Terjual</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Total Modal</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Total Omset</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Keuntungan</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d, i) => {
                    const profit = d.omset - d.modal
                    return (
                      <tr key={i} className="border-t hover:bg-surface-raised transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{d.name}</td>
                        <td className="px-4 py-3 text-muted">{d.qty}</td>
                        <td className="px-4 py-3 font-mono text-muted">{formatPrice(d.modal)}</td>
                        <td className="px-4 py-3 font-mono text-foreground">{formatPrice(d.omset)}</td>
                        <td className="px-4 py-3 font-mono text-success font-semibold">{formatPrice(profit)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
