'use client'

import { Bill, BillStatus, BILL_STATUS_LABELS } from '@/types'
import { formatPrice } from '@/utils/product'
import { Check, X } from 'lucide-react'

const STATUS_STYLES: Record<BillStatus, string> = {
  pending: 'bg-warning/15 text-warning',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-danger/15 text-danger',
}

export function AdminBillCard({ bill, onSetStatus }: {
  bill: Bill
  onSetStatus: (b: Bill, s: BillStatus) => void
}) {
  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 hover:shadow-card-hover transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground text-base">
              {bill.products?.name || 'Produk terhapus'}
            </h3>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_STYLES[bill.status]}`}>
              {BILL_STATUS_LABELS[bill.status]}
            </span>
          </div>
          {bill.products?.providers?.name && (
            <p className="text-xs text-muted mt-0.5">{bill.products.providers.name}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <div>
              <span className="text-muted">Jumlah:</span>
              <span className="font-medium text-foreground ml-1">{bill.quantity}</span>
            </div>
            <div>
              <span className="text-muted">Total:</span>
              <span className="font-mono text-foreground font-medium ml-1">
                {formatPrice(bill.total_price)}
              </span>
            </div>
            <div>
              <span className="text-muted">Waktu:</span>
              <span className="text-muted ml-1">{formatDate(bill.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {bill.status === 'pending' && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
          <button
            onClick={() => onSetStatus(bill, 'approved')}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-success/15 text-success hover:bg-success hover:text-white transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Approve
          </button>
          <button
            onClick={() => onSetStatus(bill, 'rejected')}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-danger/15 text-danger hover:bg-danger hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Reject
          </button>
        </div>
      )}
    </div>
  )
}
