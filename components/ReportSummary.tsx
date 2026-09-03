import { formatPrice } from '@/utils/product'
import { TrendingUp, Wallet, ArrowDownRight, ShoppingCart } from 'lucide-react'
import { ReportData } from '@/types'

export function ReportSummary({ data }: { data: ReportData }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-surface rounded-2xl border border-border shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted">Total Modal</span>
          <div className="bg-warning/10 p-2.5 rounded-xl text-warning">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>
        <p className="text-2xl font-bold font-mono text-foreground">{formatPrice(data.modal)}</p>
        <p className="text-xs text-muted mt-1">Berdasarkan harga modal produk</p>
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted">Total Omset</span>
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <p className="text-2xl font-bold font-mono text-foreground">{formatPrice(data.omset)}</p>
        <p className="text-xs text-muted mt-1">Quantity × Harga Jual</p>
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted">Keuntungan Bersih</span>
          <div className="bg-success/10 p-2.5 rounded-xl text-success">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <p className="text-2xl font-bold font-mono text-success">{formatPrice(data.keuntungan)}</p>
        <p className="text-xs text-muted mt-1">Omset dikurangi Modal</p>
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted">Produk Terjual</span>
          <div className="bg-accent/10 p-2.5 rounded-xl text-accent">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>
        <p className="text-2xl font-bold font-mono text-foreground">{data.totalOrders} <span className="text-xs font-normal text-muted">transaksi</span></p>
        <p className="text-xs text-muted mt-1">Pesanan berstatus approved</p>
      </div>
    </div>
  )
}
