'use client'

import { Category, Provider } from '@/types'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export function ReportFilters({
  categories,
  providers,
}: {
  categories: Category[]
  providers: Provider[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [period, setPeriod] = useState(searchParams.get('period') || 'monthly')
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || 'all')
  const [providerId, setProviderId] = useState(searchParams.get('providerId') || 'all')

  function handleFilter(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    params.set('period', period)
    if (period === 'custom') {
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
    }
    if (categoryId !== 'all') params.set('categoryId', categoryId)
    if (providerId !== 'all') params.set('providerId', providerId)
    router.push(`/admin/reports?${params.toString()}`)
  }

  function handleReset() {
    setPeriod('monthly')
    setStartDate('')
    setEndDate('')
    setCategoryId('all')
    setProviderId('all')
    router.push('/admin/reports?period=monthly')
  }

  return (
    <form onSubmit={handleFilter} className="bg-surface rounded-2xl border border-border shadow-card p-5 mb-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">Periode</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input-field"
          >
            <option value="daily">Harian (Hari ini)</option>
            <option value="weekly">Mingguan (7 Hari terakhir)</option>
            <option value="monthly">Bulanan (Bulan ini)</option>
            <option value="yearly">Tahunan (Tahun ini)</option>
            <option value="custom">Kustom Tanggal</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">Kategori</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input-field"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">Provider</label>
          <select
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            className="input-field"
          >
            <option value="all">Semua Provider</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary flex-1 text-sm">
            Terapkan
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {period === 'custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
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
    </form>
  )
}
