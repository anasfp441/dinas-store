'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { FinancialTransaction, FinancialType } from '@/types'
import { formatPrice } from '@/utils/product'
import { TransactionForm } from '@/components/TransactionForm'
import { BillImportModal } from '@/components/BillImportModal'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Wallet,
  Import,
} from 'lucide-react'

const TYPE_STYLES: Record<FinancialType, string> = {
  pemasukan: 'bg-success/15 text-success',
  pengeluaran: 'bg-danger/15 text-danger',
}

const TYPE_LABELS: Record<FinancialType, string> = {
  pemasukan: 'Pemasukan',
  pengeluaran: 'Pengeluaran',
}

type Period = 'all' | 'today' | 'week' | 'month' | 'custom'

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'all', label: 'Semua Waktu' },
  { value: 'today', label: 'Hari Ini' },
  { value: 'week', label: '7 Hari Terakhir' },
  { value: 'month', label: 'Bulan Ini' },
  { value: 'custom', label: 'Rentang Tanggal' },
]

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CatatanKeuanganPage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | FinancialType>('all')
  const [period, setPeriod] = useState<Period>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editing, setEditing] = useState<FinancialTransaction | null>(null)

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getSupabase()
      .from('financial_transactions')
      .select('*')
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false })

    if (!error && data) setTransactions(data as FinancialTransaction[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const periodBounds = useMemo(() => {
    const now = new Date()
    const today = todayISO()
    if (period === 'today') return { min: today, max: today }
    if (period === 'week') {
      const d = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
      return {
        min: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        max: today,
      }
    }
    if (period === 'month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      return {
        min: `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-01`,
        max: today,
      }
    }
    if (period === 'custom') return { min: startDate, max: endDate }
    return { min: '', max: '' }
  }, [period, startDate, endDate])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return transactions.filter((t) => {
      if (filterType !== 'all' && t.tipe !== filterType) return false
      if (periodBounds.min && t.tanggal < periodBounds.min) return false
      if (periodBounds.max && t.tanggal > periodBounds.max) return false
      if (q && !(t.keterangan || '').toLowerCase().includes(q)) return false
      return true
    })
  }, [transactions, query, filterType, periodBounds])

  const summary = useMemo(() => {
    let pemasukan = 0
    let pengeluaran = 0
    let modal = 0
    filtered.forEach((t) => {
      if (t.is_modal) {
        modal += t.jumlah
      } else if (t.tipe === 'pemasukan') pemasukan += t.jumlah
      else pengeluaran += t.jumlah
    })
    return { pemasukan, pengeluaran, modal, saldo: pemasukan - pengeluaran }
  }, [filtered])

  async function handleDelete(id: string) {
    if (!confirm('Hapus transaksi ini?')) return
    const { error } = await getSupabase().from('financial_transactions').delete().eq('id', id)
    if (!error) loadTransactions()
  }

  function openAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(t: FinancialTransaction) {
    setEditing(t)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    loadTransactions()
  }

  function resetFilters() {
    setQuery('')
    setFilterType('all')
    setPeriod('all')
    setStartDate('')
    setEndDate('')
  }

  const hasFilter =
    query !== '' || filterType !== 'all' || period !== 'all' || startDate !== '' || endDate !== ''

  const sortedForDisplay = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (a.tanggal !== b.tanggal) return a.tanggal < b.tanggal ? 1 : -1
        return a.created_at < b.created_at ? 1 : -1
      }),
    [filtered]
  )

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Catatan Keuangan</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Import className="w-4 h-4" />
            Catat dari Pesanan
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 btn-primary text-sm">
            <Plus className="w-4 h-4" />
            Tambah Transaksi
          </button>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface rounded-2xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted">Total Pemasukan</span>
            <div className="bg-success/10 p-2.5 rounded-xl text-success">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-success">
            {formatPrice(summary.pemasukan)}
          </p>
          <p className="text-xs text-muted mt-1">Sesuai filter aktif</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted">Total Pengeluaran</span>
            <div className="bg-danger/10 p-2.5 rounded-xl text-danger">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-danger">
            {formatPrice(summary.pengeluaran)}
          </p>
          <p className="text-xs text-muted mt-1">Sesuai filter aktif</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted">Total Modal</span>
            <div className="bg-warning/10 p-2.5 rounded-xl text-warning">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold font-mono text-warning">
            {formatPrice(summary.modal)}
          </p>
          <p className="text-xs text-muted mt-1">Akumulasi modal</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-surface rounded-2xl border border-border shadow-card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari keterangan..."
              className="input-field pl-10 pr-9"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | FinancialType)}
            className="input-field w-auto"
          >
            <option value="all">Semua Tipe</option>
            <option value="pemasukan">Pemasukan</option>
            <option value="pengeluaran">Pengeluaran</option>
          </select>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="input-field w-auto"
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={loadTransactions}
            className="px-3 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:text-foreground transition-colors"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 inline ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-border">
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Dari Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-sm text-muted">
          <span>
            Menampilkan {filtered.length} dari {transactions.length} transaksi
          </span>
          {hasFilter && (
            <button onClick={resetFilters} className="text-danger hover:underline">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {editing ? 'Edit Transaksi' : 'Tambah Transaksi'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 text-muted hover:text-foreground rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <TransactionForm
                transaction={editing}
                onDone={closeModal}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Catat dari Pesanan */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Catat dari Pesanan</h2>
                <p className="text-xs text-muted mt-0.5">
                  Pesanan approved yang belum masuk catatan keuangan
                </p>
              </div>
              <button
                onClick={() => setImportOpen(false)}
                className="p-1 text-muted hover:text-foreground rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <BillImportModal onDone={() => { setImportOpen(false); loadTransactions() }} />
            </div>
          </div>
        </div>
      )}

      {/* Mobile - Cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {sortedForDisplay.map((t) => (
          <div key={t.id} className="bg-surface rounded-2xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {t.is_modal ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-warning/15 text-warning">
                      Modal
                    </span>
                  ) : (
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${TYPE_STYLES[t.tipe]}`}>
                      {TYPE_LABELS[t.tipe]}
                    </span>
                  )}
                  <span className="text-xs text-muted">{formatTanggal(t.tanggal)}</span>
                </div>
                {t.keterangan && (
                  <p className="text-sm text-foreground mt-2">{t.keterangan}</p>
                )}
              </div>
              <div className="text-right">
                <p className={`font-mono font-semibold ${t.tipe === 'pemasukan' ? 'text-success' : 'text-danger'}`}>
                  {t.tipe === 'pemasukan' ? '+' : '-'}{formatPrice(t.jumlah)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-border">
              <button
                onClick={() => openEdit(t)}
                className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(t.id)}
                className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                title="Hapus"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {sortedForDisplay.length === 0 && (
          <div className="bg-surface rounded-2xl border border-dashed border-border py-12 text-center">
            <p className="text-4xl mb-3">📒</p>
            <p className="text-muted mb-2">Belum ada transaksi</p>
            {hasFilter && (
              <button onClick={resetFilters} className="text-primary text-sm hover:underline">
                Reset filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop - Table */}
      <div className="hidden md:block bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Tanggal</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Tipe</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Keterangan</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Jumlah</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sortedForDisplay.map((t) => (
              <tr key={t.id} className="border-t hover:bg-surface-raised transition-colors">
                <td className="px-4 py-3 font-mono text-muted text-xs whitespace-nowrap">
                  {formatTanggal(t.tanggal)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {t.is_modal ? (
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-warning/15 text-warning w-fit">
                        Modal
                      </span>
                    ) : (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${TYPE_STYLES[t.tipe]}`}>
                        {TYPE_LABELS[t.tipe]}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-foreground">{t.keterangan || '-'}</td>
                <td
                  className={`px-4 py-3 text-right font-mono font-medium whitespace-nowrap ${
                    t.tipe === 'pemasukan' ? 'text-success' : 'text-danger'
                  }`}
                >
                  {t.tipe === 'pemasukan' ? '+' : '-'}
                  {formatPrice(t.jumlah)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(t)}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sortedForDisplay.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-4xl mb-3">📒</p>
                  <p className="text-muted mb-2">Belum ada transaksi</p>
                  {hasFilter && (
                    <button onClick={resetFilters} className="text-primary text-sm hover:underline">
                      Reset filter
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}