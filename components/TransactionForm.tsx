'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { FinancialTransaction, FinancialType } from '@/types'

const TIPE_LABELS: Record<FinancialType, string> = {
  pemasukan: 'Pemasukan',
  pengeluaran: 'Pengeluaran',
}

export function TransactionForm({
  transaction,
  onDone,
  onCancel,
}: {
  transaction?: FinancialTransaction | null
  onDone: () => void
  onCancel?: () => void
}) {
  const [tipe, setTipe] = useState<FinancialType>(transaction?.tipe ?? 'pemasukan')
  const [tanggal, setTanggal] = useState(
    transaction?.tanggal ?? new Date().toISOString().slice(0, 10)
  )
  const [jumlah, setJumlah] = useState(
    transaction ? transaction.jumlah.toString() : ''
  )
  const [keterangan, setKeterangan] = useState(transaction?.keterangan ?? '')
  const [isModal, setIsModal] = useState(transaction?.is_modal ?? false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const nominal = parseInt(jumlah.replace(/\D/g, ''), 10) || 0
    if (nominal <= 0) {
      setError('Jumlah harus lebih dari 0')
      return
    }
    if (!tanggal) {
      setError('Tanggal wajib diisi')
      return
    }

    setSaving(true)
    const payload = {
      tipe,
      jumlah: nominal,
      tanggal,
      keterangan: keterangan.trim() || null,
      is_modal: isModal,
    }

    const sb = getSupabase()
    const result = transaction
      ? await sb.from('financial_transactions').update(payload).eq('id', transaction.id)
      : await sb.from('financial_transactions').insert(payload)

    setSaving(false)
    if (result.error) {
      setError(result.error.message)
      return
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-danger text-sm bg-danger/10 rounded-lg px-3 py-2">{error}</p>}

      <div>
        <label className="block text-sm font-medium mb-2 text-foreground">Tipe Transaksi *</label>
        <div className="grid grid-cols-2 gap-3">
          {(['pemasukan', 'pengeluaran'] as const).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setTipe(t)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                tipe === t
                  ? t === 'pemasukan'
                    ? 'bg-success text-white border-success shadow-sm'
                    : 'bg-danger text-white border-danger shadow-sm'
                  : 'bg-surface text-muted border-border hover:border-border'
              }`}
            >
              {TIPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">Tanggal *</label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">Jumlah (Rp) *</label>
          <input
            type="text"
            inputMode="numeric"
            value={jumlah}
            onChange={(e) => setJumlah(e.target.value)}
            className="input-field font-mono"
            placeholder="10000"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">Keterangan</label>
        <textarea
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          className="input-field min-h-[70px]"
          rows={2}
          placeholder="Contoh: Gaji bulan ini / Beli stok pulsa"
        />
      </div>

      <label className="flex items-start gap-3 bg-surface-raised border border-border rounded-xl p-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isModal}
          onChange={(e) => setIsModal(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-primary"
        />
        <span>
          <span className="block text-sm font-medium text-foreground">Catat sebagai Modal</span>
          <span className="block text-xs text-muted mt-0.5">
            Transaksi ini dihitung terpisah dari saldo kas.
          </span>
        </span>
      </label>

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary flex-1">
          {saving ? 'Menyimpan...' : transaction ? 'Simpan Perubahan' : 'Tambah Transaksi'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  )
}