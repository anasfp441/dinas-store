'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { Bill } from '@/types'
import { formatPrice } from '@/utils/product'
import { Check, X, Calendar } from 'lucide-react'

export function BillApproveModal({
  bill,
  onDone,
  onCancel,
}: {
  bill: Bill
  onDone: () => void
  onCancel: () => void
}) {
  const [modalHarga, setModalHarga] = useState(bill.harga_modal)
  const [modalSatuan, setModalSatuan] = useState(bill.harga_satuan)
  const [deskripsi, setDeskripsi] = useState(bill.description || '')
  const [tanggal, setTanggal] = useState(new Date(bill.created_at).toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const total = (modalSatuan || 0) * bill.quantity
  const catatan = deskripsi.trim()

  async function handleApprove() {
    setSaving(true)
    setError('')

    const sb = getSupabase()
    const now = new Date()

    const { error: upErr } = await sb
      .from('bills')
      .update({
        status: 'approved',
        approved_at: now.toISOString(),
        harga_modal: modalHarga,
        harga_satuan: modalSatuan,
        total_price: total,
        description: catatan || null,
        created_at: new Date(tanggal + 'T12:00:00').toISOString(),
      })
      .eq('id', bill.id)

    if (upErr) {
      setError(upErr.message)
      setSaving(false)
      return
    }

    const namaProduk = bill.products?.name || 'produk'
    const keterangan = catatan ? `${catatan} (${namaProduk})` : `Penjualan ${namaProduk}`
    const rows = [
      {
        tipe: 'pemasukan',
        jumlah: total,
        keterangan,
        tanggal,
        ref_bill_id: bill.id,
        is_modal: false,
      },
      {
        tipe: 'pengeluaran',
        jumlah: (modalHarga || 0) * bill.quantity,
        keterangan: catatan ? keterangan : `Modal ${namaProduk}`,
        tanggal,
        ref_bill_id: null,
        is_modal: false,
      },
    ]

    const { error: ftErr } = await sb.from('financial_transactions').insert(rows)

    if (ftErr) {
      setError(ftErr.message)
      setSaving(false)
      return
    }

    setSaving(false)
    onDone()
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-danger text-sm bg-danger/10 rounded-lg px-3 py-2">{error}</p>}

      <div className="bg-surface-raised rounded-xl p-4 border border-border">
        <p className="text-sm font-medium text-foreground">
          {bill.products?.name || 'Produk terhapus'}
        </p>
        <p className="text-xs text-muted mt-0.5">
          {bill.quantity} pcs &middot; {formatPrice(bill.total_price)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">Tanggal *</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="input-field pl-8 pr-3"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">Harga Modal</label>
          <input
            type="number"
            value={modalHarga}
            onChange={(e) => setModalHarga(parseInt(e.target.value, 10) || 0)}
            className="input-field font-mono"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">Harga Satuan</label>
          <input
            type="number"
            value={modalSatuan}
            onChange={(e) => setModalSatuan(parseInt(e.target.value, 10) || 0)}
            className="input-field font-mono"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">Deskripsi</label>
        <textarea
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          rows={3}
          placeholder="Tulis keterangan untuk transaksi (opsional)"
          className="input-field w-full resize-y min-h-[80px]"
        />
      </div>

      <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-center justify-between">
        <span className="text-sm font-medium text-success">Total Pemasukan</span>
        <span className="text-xl font-bold font-mono text-success">{formatPrice(total)}</span>
      </div>

      <div className="flex gap-2">
        <button onClick={handleApprove} disabled={saving} className="btn-primary flex-1">
          {saving ? 'Menyimpan...' : <><Check className="w-4 h-4" />Approve & Catat</>}
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:text-foreground transition-colors">
          Batal
        </button>
      </div>
    </div>
  )
}