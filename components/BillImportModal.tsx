'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { Bill } from '@/types'
import { formatPrice } from '@/utils/product'
import { Loader2, Check } from 'lucide-react'

export function BillImportModal({ onDone }: { onDone: () => void }) {
  const [bills, setBills] = useState<Bill[]>([])
  const [recordedMap, setRecordedMap] = useState<Map<string, { hasPemasukan: boolean; hasPengeluaran: boolean }>>(new Map())
  const [inSelected, setInSelected] = useState<Set<string>>(new Set())
  const [outSelected, setOutSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadBills() {
    setLoading(true)
    setError('')

    const { data: billRows, error: billErr } = await getSupabase()
      .from('bills')
      .select('*, products(id, name, image_url, providers(name))')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (billErr) {
      setError(billErr.message)
      setLoading(false)
      return
    }

    const billList = (billRows as Bill[]) || []
    const billIds = billList.map((b) => b.id)

    // Ambil semua transaksi keuangan yang berkaitan dengan bills ini
    const { data: recorded, error: recErr } = await getSupabase()
      .from('financial_transactions')
      .select('ref_bill_id, tipe, is_modal, tanggal')
      .or(`ref_bill_id.in.(${billIds.join(',')}),and(tipe.eq.pengeluaran,is_modal.eq.false)`)

    if (recErr) {
      setError(recErr.message)
      setLoading(false)
      return
    }

    // Buat map: bill_id -> { hasPemasukan, hasPengeluaran }
    const recordedMap = new Map<string, { hasPemasukan: boolean; hasPengeluaran: boolean }>()

    billList.forEach((b) => {
      recordedMap.set(b.id, { hasPemasukan: false, hasPengeluaran: false })
    })

    ;(recorded || []).forEach((r: { ref_bill_id: string | null; tipe: string; is_modal: boolean; tanggal: string }) => {
      if (r.ref_bill_id && r.tipe === 'pemasukan') {
        const rec = recordedMap.get(r.ref_bill_id)
        if (rec) rec.hasPemasukan = true
      } else if (!r.ref_bill_id && r.tipe === 'pengeluaran' && !r.is_modal) {
        // Cari bill dengan tanggal yang cocok (created_at == tanggal)
        billList.forEach((b) => {
          const billDate = new Date(b.created_at).toISOString().slice(0, 10)
          if (billDate === r.tanggal) {
            const rec = recordedMap.get(b.id)
            if (rec) rec.hasPengeluaran = true
          }
        })
      }
    })

    // Tetap tampilkan bill, tapi dengan info mana yang sudah tercatat
    setBills(billList)
    setRecordedMap(recordedMap)
    setInSelected(new Set())
    setOutSelected(new Set())
    setLoading(false)
  }

  useEffect(() => {
    loadBills()
  }, [])

  function toggleIn(id: string) {
    setInSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleOut(id: string) {
    setOutSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const totalCount = new Set([...inSelected, ...outSelected]).size
  const totalIncome = bills
    .filter((b) => inSelected.has(b.id))
    .reduce((sum, b) => sum + (b.total_price || 0), 0)
  const totalExpense = bills
    .filter((b) => outSelected.has(b.id))
    .reduce((sum, b) => sum + (b.harga_modal || 0) * b.quantity, 0)
  const totalNet = totalIncome - totalExpense

  const billsNeedingAction = bills.filter(
    (b) => !recordedMap.get(b.id)?.hasPemasukan || !recordedMap.get(b.id)?.hasPengeluaran
  )
  const allRecorded = bills.length > 0 && bills.every((b) => {
    const r = recordedMap.get(b.id)
    return r?.hasPemasukan && r?.hasPengeluaran
  })

  const showBills = allRecorded ? [] : billsNeedingAction

  async function handleImport() {
    if (inSelected.size === 0 && outSelected.size === 0) return
    setSaving(true)
    setError('')

    const rows = bills
      .filter((b) => inSelected.has(b.id) || outSelected.has(b.id))
      .flatMap((b) => {
        const tanggal = new Date(b.created_at).toISOString().slice(0, 10)
        const nama = b.products?.name || 'produk'
        const modal = (b.harga_modal || 0) * b.quantity
        const out: Record<string, unknown>[] = []

        if (inSelected.has(b.id)) {
          out.push({
            tipe: 'pemasukan',
            jumlah: b.total_price || 0,
            tanggal,
            keterangan: b.description ? `${b.description} (${nama})` : `Penjualan ${nama}`,
            ref_bill_id: b.id,
            is_modal: false,
          })
        }

        if (outSelected.has(b.id) && modal > 0) {
          out.push({
            tipe: 'pengeluaran',
            jumlah: modal,
            tanggal,
            keterangan: b.description ? `${b.description} (${nama})` : `Modal ${nama}`,
            ref_bill_id: null,
            is_modal: false,
          })
        }

        return out
      })

    if (rows.length === 0) {
      setSaving(false)
      setError('Tidak ada transaksi yang bisa dicatat (modal 0 atau belum ada yang dipilih).')
      return
    }

    const { error: insErr } = await getSupabase().from('financial_transactions').insert(rows)

    setSaving(false)
    if (insErr) {
      setError(insErr.message)
      return
    }
    onDone()
  }

  return (
    <div>
      {error && <p className="text-danger text-sm bg-danger/10 rounded-lg px-3 py-2 mb-4">{error}</p>}

      {loading ? (
        <div className="py-10 flex items-center justify-center gap-2 text-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          Memuat pesanan...
        </div>
      ) : showBills.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-muted font-medium">Semua pesanan approved sudah tercatat</p>
          <p className="text-xs text-muted mt-1">Tidak ada pesanan yang perlu dicatat</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={
                    showBills.every((b) => inSelected.has(b.id)) &&
                    showBills.every((b) => !recordedMap.get(b.id)?.hasPemasukan) &&
                    showBills.length > 0
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setInSelected(
                        new Set(
                          showBills.filter((b) => !recordedMap.get(b.id)?.hasPemasukan).map((b) => b.id)
                        )
                      )
                    } else {
                      setInSelected(new Set())
                    }
                  }}
                  className="w-4 h-4 rounded border-border bg-surface"
                />
                <span className="font-medium text-success">Pemasukan ({inSelected.size})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={
                    showBills.every((b) => outSelected.has(b.id)) &&
                    showBills.every((b) => !recordedMap.get(b.id)?.hasPengeluaran) &&
                    showBills.length > 0
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setOutSelected(
                        new Set(
                          showBills.filter((b) => !recordedMap.get(b.id)?.hasPengeluaran).map((b) => b.id)
                        )
                      )
                    } else {
                      setOutSelected(new Set())
                    }
                  }}
                  className="w-4 h-4 rounded border-border bg-surface"
                />
                <span className="font-medium text-danger">Pengeluaran ({outSelected.size})</span>
              </label>
            </div>
            <div className="text-right ml-auto md:ml-0">
              <p className="text-xs font-medium text-foreground">Akan dicatat: {totalCount} transaksi</p>
              <p className="text-[10px] text-muted">
                Pemasukan: {formatPrice(totalIncome)} &middot; Pengeluaran: {formatPrice(totalExpense)} &middot; Net: {formatPrice(totalNet)}
              </p>
            </div>
          </div>

          <div className="max-h-[45vh] overflow-y-auto border border-border rounded-xl divide-y divide-border">
            {showBills.map((b) => {
              const rec = recordedMap.get(b.id)
              const hasIn = rec?.hasPemasukan ?? false
              const hasOut = rec?.hasPengeluaran ?? false
              return (
                <div key={b.id} className="p-3 hover:bg-surface-raised transition-colors">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {b.products?.name || 'Produk terhapus'}
                      </p>
                      {b.description && (
                        <p className="text-xs text-muted truncate mt-0.5">{b.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted whitespace-nowrap">
                      {b.quantity} pcs &middot;{' '}
                      {new Date(b.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <label className={`flex items-center gap-1.5 cursor-pointer ${hasIn ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="checkbox"
                        checked={inSelected.has(b.id)}
                        disabled={hasIn}
                        onChange={() => toggleIn(b.id)}
                        className="w-4 h-4 rounded border-border bg-surface"
                      />
                      <span className="text-xs font-medium text-success">
                        Pemasukan {formatPrice(b.total_price)} {hasIn && <span className="text-xs text-success ml-1">(sudah ada)</span>}
                      </span>
                    </label>
                    <label className={`flex items-center gap-1.5 cursor-pointer ${hasOut ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="checkbox"
                        checked={outSelected.has(b.id)}
                        disabled={hasOut}
                        onChange={() => toggleOut(b.id)}
                        className="w-4 h-4 rounded border-border bg-surface"
                      />
                      <span className="text-xs font-medium text-danger">
                        Pengeluaran {formatPrice((b.harga_modal || 0) * b.quantity)} {hasOut && <span className="text-xs text-danger ml-1">(sudah ada)</span>}
                      </span>
                    </label>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleImport}
              disabled={inSelected.size === 0 && outSelected.size === 0 || saving}
              className="btn-primary flex-1"
            >
              {saving ? 'Mencatat...' : <><Check className="w-4 h-4" /> Catat Transaksi</>}
            </button>
          </div>
        </>
      )}
    </div>
  )
}