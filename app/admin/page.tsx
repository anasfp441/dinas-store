import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatPrice } from '@/utils/product'
import { BILL_STATUS_LABELS, BillStatus } from '@/types'
import {
  Wallet,
  TrendingUp,
  ArrowDownRight,
  ShoppingCart,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Layers,
  Building2,
  ChevronRight,
  Receipt,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<BillStatus, string> = {
  pending: 'bg-warning/15 text-warning',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-danger/15 text-danger',
}

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient()

  // ---- Jumlah dasar ----
  const [{ count: productCount }, { count: categoryCount }, { count: providerCount }] =
    await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('providers').select('*', { count: 'exact', head: true }),
    ])

  // ---- Status bill ----
  const [{ count: pendingBills }, { count: approvedBills }, { count: rejectedBills }] =
    await Promise.all([
      supabase.from('bills').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('bills').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('bills').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    ])

  // ---- Bill approved (semua, untuk hitung keuangan) ----
  const { data: bills } = await supabase
    .from('bills')
    .select('id, quantity, created_at, product_id, status')
    .eq('status', 'approved')

  // ---- Produk + data jual ----
  const { data: products } = await supabase
    .from('products')
    .select('id, name, harga_modal, harga_jual, sold, provider_id, is_active')

  const productMap: Record<string, any> = {}
  ;(products || []).forEach((p: any) => {
    productMap[p.id] = p
  })

  // ---- Hitung keuangan (approved only) ----
  let totalModal = 0
  let totalOmset = 0
  let todayOmset = 0
  let todayProfit = 0
  let totalProfit = 0

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  ;(bills || []).forEach((b: any) => {
    const p = productMap[b.product_id]
    if (!p) return
    const qty = b.quantity || 1
    const modal = (p.harga_modal || 0) * qty
    const omset = (p.harga_jual || 0) * qty
    totalModal += modal
    totalOmset += omset
    if (new Date(b.created_at) >= todayStart) {
      todayOmset += omset
      todayProfit += omset - modal
    }
  })
  totalProfit = totalOmset - totalModal

  const totalSold = (products || []).reduce((acc: number, p: any) => acc + (p.sold || 0), 0)

  // ---- Produk terlaris ----
  const topProducts = [...(products || [])]
    .sort((a: any, b: any) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 5)

  const maxSold = topProducts[0]?.sold || 1

  // ---- Pesanan terbaru ----
  const { data: recentBills } = await supabase
    .from('bills')
    .select('id, quantity, total_price, status, created_at, product_id')
    .order('created_at', { ascending: false })
    .limit(6)

  const recentWithProduct = (recentBills || []).map((b: any) => ({
    ...b,
    product: productMap[b.product_id] || null,
  }))

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function profitPercent() {
    if (totalOmset <= 0) return 0
    return Math.round((totalProfit / totalOmset) * 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">
            Ringkasan performa toko Anda
          </p>
        </div>
        <Link href="/admin/reports" className="btn-primary text-sm self-start sm:self-auto">
          Lihat Laporan Lengkap
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ===== Kartu keuangan ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary to-primary-hover rounded-2xl shadow-card p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white/80">Omset Hari Ini</span>
            <div className="bg-white/20 p-2.5 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono">{formatPrice(todayOmset)}</p>
          <p className="text-xs text-white/70 mt-1">Transaksi approved hari ini</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted">Total Omset</span>
            <div className="bg-secondary/10 p-2.5 rounded-xl text-secondary">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{formatPrice(totalOmset)}</p>
          <p className="text-xs text-muted mt-1">Akumulasi semua transaksi</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted">Keuntungan Bersih</span>
            <div className="bg-success/10 p-2.5 rounded-xl text-success">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-success">{formatPrice(totalProfit)}</p>
          <p className="text-xs text-muted mt-1">Margin {profitPercent()}% · Modal {formatPrice(totalModal)}</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted">Produk Terjual</span>
            <div className="bg-accent/10 p-2.5 rounded-xl text-accent">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{totalSold} <span className="text-xs font-normal text-muted">unit</span></p>
          <p className="text-xs text-muted mt-1">Total jumlah terjual semua produk</p>
        </div>
      </div>

      {/* ===== Status pesanan ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/bills" className="group bg-surface rounded-2xl border border-border shadow-card p-5 flex items-center gap-4 hover:border-warning/40 transition-all">
          <div className="bg-warning/10 p-3 rounded-2xl text-warning">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-foreground">{pendingBills ?? 0}</p>
            <p className="text-sm text-muted">Pesanan Menunggu</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted group-hover:text-foreground transition-colors" />
        </Link>

        <Link href="/admin/bills" className="group bg-surface rounded-2xl border border-border shadow-card p-5 flex items-center gap-4 hover:border-success/40 transition-all">
          <div className="bg-success/10 p-3 rounded-2xl text-success">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-foreground">{approvedBills ?? 0}</p>
            <p className="text-sm text-muted">Pesanan Disetujui</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted group-hover:text-foreground transition-colors" />
        </Link>

        <Link href="/admin/bills" className="group bg-surface rounded-2xl border border-border shadow-card p-5 flex items-center gap-4 hover:border-danger/40 transition-all">
          <div className="bg-danger/10 p-3 rounded-2xl text-danger">
            <XCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-foreground">{rejectedBills ?? 0}</p>
            <p className="text-sm text-muted">Pesanan Ditolak</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted group-hover:text-foreground transition-colors" />
        </Link>
      </div>

      {/* ===== Grid bawah: produk terlaris + pesanan terbaru ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produk terlaris */}
        <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="font-semibold text-foreground">Produk Terlaris</h2>
              <p className="text-xs text-muted mt-0.5">Berdasarkan jumlah terjual</p>
            </div>
            <Link href="/admin/products" className="text-sm text-primary hover:underline font-medium">
              Lihat Semua
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <div className="p-10 text-center text-muted">Belum ada data produk</div>
          ) : (
            <div className="divide-y divide-border">
              {topProducts.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-warning/15 text-warning' : i === 1 ? 'bg-muted/15 text-muted' : i === 2 ? 'bg-warning/5 text-muted' : 'bg-background text-muted'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <div className="mt-1.5 h-1.5 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                        style={{ width: `${Math.max(6, Math.round(((p.sold || 0) / maxSold) * 100))}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">{p.sold || 0}</p>
                    <p className="text-xs text-muted">terjual</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pesanan terbaru */}
        <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="font-semibold text-foreground">Pesanan Terbaru</h2>
              <p className="text-xs text-muted mt-0.5">Transaksi terakhir masuk</p>
            </div>
            <Link href="/admin/bills" className="text-sm text-primary hover:underline font-medium">
              Kelola Pesanan
            </Link>
          </div>
          {recentWithProduct.length === 0 ? (
            <div className="p-10 text-center text-muted">Belum ada pesanan</div>
          ) : (
            <div className="divide-y divide-border">
              {recentWithProduct.map((b: any) => (
                <div key={b.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${
                    b.status === 'approved' ? 'bg-success/10 text-success' : b.status === 'rejected' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                  }`}>
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {b.product?.name || 'Produk terhapus'}
                    </p>
                    <p className="text-xs text-muted">{formatDateTime(b.created_at)} · Qty {b.quantity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-bold text-foreground">{formatPrice(b.total_price)}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_STYLES[b.status as BillStatus]}`}>
                      {BILL_STATUS_LABELS[b.status as BillStatus]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== Grid bawah: link cepat ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/products" className="group bg-surface rounded-2xl border border-border shadow-card p-5 flex items-center gap-4 hover:border-primary/40 transition-all">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary">
            <Package className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-foreground">{productCount ?? 0}</p>
            <p className="text-sm text-muted">Total Produk</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted group-hover:text-foreground transition-colors" />
        </Link>

        <Link href="/admin/categories" className="group bg-surface rounded-2xl border border-border shadow-card p-5 flex items-center gap-4 hover:border-accent/40 transition-all">
          <div className="bg-accent/10 p-3 rounded-2xl text-accent">
            <Layers className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-foreground">{categoryCount ?? 0}</p>
            <p className="text-sm text-muted">Total Kategori</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted group-hover:text-foreground transition-colors" />
        </Link>

        <Link href="/admin/providers" className="group bg-surface rounded-2xl border border-border shadow-card p-5 flex items-center gap-4 hover:border-secondary/40 transition-all">
          <div className="bg-secondary/10 p-3 rounded-2xl text-secondary">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-foreground">{providerCount ?? 0}</p>
            <p className="text-sm text-muted">Total Provider</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted group-hover:text-foreground transition-colors" />
        </Link>
      </div>
    </div>
  )
}
