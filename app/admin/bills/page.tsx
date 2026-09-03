'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { Bill, BillStatus, BILL_STATUS_LABELS } from '@/types'
import { formatPrice } from '@/utils/product'
import { Check, X, RefreshCw } from 'lucide-react'
import { AdminBillCard } from '@/components/AdminBillCard'

const STATUS_STYLES: Record<BillStatus, string> = {
  pending: 'bg-warning/15 text-warning',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-danger/15 text-danger',
}

export default function AdminBillsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [filter, setFilter] = useState<'all' | BillStatus>('all')
  const [loading, setLoading] = useState(false)

  const loadBills = useCallback(async () => {
    setLoading(true)
    const { data } = await getSupabase()
      .from('bills')
      .select('*, products(id, name, image_url, providers(name))')
      .order('created_at', { ascending: false })
    setBills((data as Bill[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadBills()
  }, [loadBills])

  const filtered = filter === 'all' ? bills : bills.filter((b) => b.status === filter)

  async function setStatus(bill: Bill, status: BillStatus) {
    const { error } = await getSupabase()
      .from('bills')
      .update({ status })
      .eq('id', bill.id)
    if (!error) loadBills()
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const count = (s: BillStatus) => bills.filter((b) => b.status === s).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Pesanan (Bills)</h1>
        <button
          onClick={loadBills}
          className="flex items-center gap-2 btn-primary text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Muat Ulang
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-primary text-white shadow-sm'
                : 'bg-background text-muted border border-border hover:border-primary/40 hover:text-primary'
            }`}
          >
            {s === 'all' ? 'Semua' : BILL_STATUS_LABELS[s]}
            {s !== 'all' && (
              <span className="ml-1.5 text-xs opacity-80">({count(s)})</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-4xl mb-3">🧾</p>
          <p className="text-muted font-medium">Belum ada pesanan</p>
        </div>
      ) : (
        <>
          {/* Mobile view - Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filtered.map((b) => (
              <AdminBillCard
                key={b.id}
                bill={b}
                onSetStatus={setStatus}
              />
            ))}
          </div>

          {/* Desktop view - Table */}
          <div className="hidden md:block bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
            <table className="w-full text-sm">
            <thead className="bg-surface-raised border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Produk</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Jml</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Waktu</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-t hover:bg-surface-raised transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {b.products?.name || 'Produk terhapus'}
                    </div>
                    {b.products?.providers?.name && (
                      <div className="text-xs text-muted">{b.products.providers.name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{b.quantity}</td>
                  <td className="px-4 py-3 font-mono text-foreground">
                    {formatPrice(b.total_price)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLES[b.status]}`}>
                      {BILL_STATUS_LABELS[b.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">
                    {formatDate(b.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {b.status === 'pending' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setStatus(b, 'approved')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-success/15 text-success hover:bg-success hover:text-white transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => setStatus(b, 'rejected')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-danger/15 text-danger hover:bg-danger hover:text-white transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  )
}
