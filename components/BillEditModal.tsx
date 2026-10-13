'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { Bill, BillStatus } from '@/types'
import { formatPrice } from '@/utils/product'
import { Check, Calendar } from 'lucide-react'

export function BillEditModal({
  bill,
  onDone,
  onCancel,
}: {
  bill: Bill
  onDone: () => void
  onCancel: () => void
}) {
  const [quantity, setQuantity] = useState(bill.quantity)
  const [modalHarga, setModalHarga] = useState(bill.harga_modal)
  const [modalSatuan, setModalSatuan] = useState(bill.harga_satuan)
  const [deskripsi, setDeskripsi] = useState(bill.description || '')
  const [status, setStatus] = useState<BillStatus>(bill.status)
  const [tanggal, setTanggal] = useState(
    new Date(bill.created_at).toISOString().slice(0, 10)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const total = (modalSatuan || 0) * (quantity || 0)
  const catatan = deskripsi.trim()

  async function handleSave() {
    if (quantity <= 0) {
      setError('Jumlah minimal 1')
      return
    }
    if (!tanggal) {
      setError('Tanggal wajib diisi')
      return
    }

    setSaving(true)
    setError('')

    const sb = getSupabase()

    const { error: upErr } = await sb
      .from('bills')
      .update({
        quantity,
        harga_modal: modalHarga,
        harga_satuan: modalSatuan,
        total_price: total,
        description: catatan || null,
        status,
        created_at: new Date(tanggal + 'T12:00:00').toISOString(),
      })
      .eq('id', bill.id)

    if (upErr) {
      setError(upErr.message)
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
        {bill.products?.providers?.name && (
          <p className="text-xs text-muted mt-0.5">{bill.products.providers.name}</p>
        )}
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
          <label className="block text-sm font-medium mb-1 text-foreground">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BillStatus)}
            className="input-field"
          >
            <option value="pending">Menunggu (pending)</option>
            <option value="approved">Disetujui (approved)</option>
            <option value="rejected">Ditolak (rejected)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">Jumlah (Qty)</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
            className="input-field font-mono"
          />
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
        <label className="block text-sm font-medium mb-1 text-foreground">Deskripsi / Catatan</label>
        <textarea
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          rows={3}
          placeholder="Tulis catatan bill (opsional)"
          className="input-field w-full resize-y min-h-[80px]"
        />
      </div>

      <div className="bg-surface-raised border border-border rounded-xl p-4 flex items-center justify-between">
        <span className="text-sm font-medium text-muted">Total Harga</span>
        <span className="text-xl font-bold font-mono text-foreground">{formatPrice(total)}</span>
      </div>

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
          {saving ? 'Menyimpan...' : <><Check className="w-4 h-4" />Simpan Perubahan</>}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:text-foreground transition-colors"
        >
          Batal
        </button>
      </div>
    </div>
  )
}
