'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Product } from '@/types'
import { effectivePrice, formatPrice, hasDiscount } from '@/utils/product'
import { ArrowLeftRight, GitCompareArrows, Minus, Plus, Trash2 } from 'lucide-react'

function parseNumber(value: string | null): number | null {
  if (!value) return null
  const n = parseFloat(String(value).replace(/[^0-9.,-]/g, '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

function getQuotaGB(p: Product): number | null {
  const raw = parseNumber(p.kuota)
  if (raw != null) return p.kuota && /TB/i.test(p.kuota) ? raw * 1024 : raw
  return parseNumber(p.nominal)
}

function getDays(p: Product): number | null {
  return parseNumber(p.masa_aktif)
}

type Metric = {
  label: string
  a: string
  b: string
  aNum: number | null
  bNum: number | null
  better: 'lower' | 'higher' | 'none'
  selisih: string
}

function diffText(a: number | null, b: number | null, format: (n: number) => string): string {
  if (a == null || b == null) return '-'
  const d = Math.abs(a - b)
  if (d === 0) return 'Sama saja'
  const sign = b > a ? `B lebih besar ${format(d)}` : `A lebih besar ${format(d)}`
  return sign
}

export function CompareClient({ products }: { products: Product[] }) {
  const [idA, setIdA] = useState('')
  const [idB, setIdB] = useState('')
  const [qtyA, setQtyA] = useState(1)
  const [qtyB, setQtyB] = useState(1)

  const productA = useMemo(() => products.find((p) => p.id === idA) || null, [products, idA])
  const productB = useMemo(() => products.find((p) => p.id === idB) || null, [products, idB])

  const options = useMemo(
    () =>
      [...products].sort((a, b) => {
        const prov = (a.providers?.name || '').localeCompare(b.providers?.name || '')
        if (prov !== 0) return prov
        return a.name.localeCompare(b.name, undefined, { numeric: true })
      }),
    [products]
  )

  const metrics: Metric[] | null = useMemo(() => {
    if (!productA || !productB) return null

    const unitPriceA = effectivePrice(productA)
    const unitPriceB = effectivePrice(productB)
    const totalPriceA = unitPriceA * qtyA
    const totalPriceB = unitPriceB * qtyB

    const unitQuotaA = getQuotaGB(productA)
    const unitQuotaB = getQuotaGB(productB)
    const totalQuotaA = unitQuotaA != null ? unitQuotaA * qtyA : null
    const totalQuotaB = unitQuotaB != null ? unitQuotaB * qtyB : null

    const unitDaysA = getDays(productA)
    const unitDaysB = getDays(productB)
    const totalDaysA = unitDaysA != null ? unitDaysA * qtyA : null
    const totalDaysB = unitDaysB != null ? unitDaysB * qtyB : null

    const perGbA = totalQuotaA != null ? totalPriceA / totalQuotaA : null
    const perGbB = totalQuotaB != null ? totalPriceB / totalQuotaB : null
    const perDayA = totalDaysA != null ? totalPriceA / totalDaysA : null
    const perDayB = totalDaysB != null ? totalPriceB / totalDaysB : null
    const gbPerDayA = totalQuotaA != null && totalDaysA != null ? totalQuotaA / totalDaysA : null
    const gbPerDayB = totalQuotaB != null && totalDaysB != null ? totalQuotaB / totalDaysB : null

    const fmtRp = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`
    const fmtGb = (n: number) => `${Number(n.toFixed(2)).toLocaleString('id-ID')} GB`
    const fmtDay = (n: number) => `${Number(n.toFixed(1)).toLocaleString('id-ID')} Hari`
    const fmtNum = (n: number) => Number(n.toFixed(2)).toLocaleString('id-ID')

    return [
      {
        label: 'Jumlah Beli',
        a: `${qtyA}x`,
        b: `${qtyB}x`,
        aNum: qtyA,
        bNum: qtyB,
        better: 'none',
        selisih: qtyA === qtyB ? 'Sama saja' : `${qtyA > qtyB ? 'A' : 'B'} beli ${Math.abs(qtyA - qtyB)}x lebih banyak`,
      },
      {
        label: 'Total Harga',
        a: qtyA > 1 ? `${formatPrice(totalPriceA)} (${qtyA}x @ ${formatPrice(unitPriceA)})` : formatPrice(totalPriceA),
        b: qtyB > 1 ? `${formatPrice(totalPriceB)} (${qtyB}x @ ${formatPrice(unitPriceB)})` : formatPrice(totalPriceB),
        aNum: totalPriceA,
        bNum: totalPriceB,
        better: 'lower',
        selisih: diffText(totalPriceA, totalPriceB, fmtRp),
      },
      {
        label: 'Total Kuota Data',
        a: totalQuotaA != null ? (qtyA > 1 ? `${fmtGb(totalQuotaA)} (${qtyA}x ${fmtGb(unitQuotaA!)})` : fmtGb(totalQuotaA)) : '-',
        b: totalQuotaB != null ? (qtyB > 1 ? `${fmtGb(totalQuotaB)} (${qtyB}x ${fmtGb(unitQuotaB!)})` : fmtGb(totalQuotaB)) : '-',
        aNum: totalQuotaA,
        bNum: totalQuotaB,
        better: 'higher',
        selisih: diffText(totalQuotaA, totalQuotaB, fmtGb),
      },
      {
        label: 'Total Masa Aktif',
        a: totalDaysA != null ? (qtyA > 1 ? `${fmtNum(totalDaysA)} Hari (${qtyA}x ${fmtNum(unitDaysA!)}H)` : `${fmtNum(totalDaysA)} Hari`) : '-',
        b: totalDaysB != null ? (qtyB > 1 ? `${fmtNum(totalDaysB)} Hari (${qtyB}x ${fmtNum(unitDaysB!)}H)` : `${fmtNum(totalDaysB)} Hari`) : '-',
        aNum: totalDaysA,
        bNum: totalDaysB,
        better: 'higher',
        selisih: diffText(totalDaysA, totalDaysB, fmtDay),
      },
      {
        label: 'Harga per GB',
        a: perGbA != null ? `${fmtRp(perGbA)}/GB` : '-',
        b: perGbB != null ? `${fmtRp(perGbB)}/GB` : '-',
        aNum: perGbA,
        bNum: perGbB,
        better: 'lower',
        selisih: diffText(perGbA, perGbB, fmtRp),
      },
      {
        label: 'Harga per Hari',
        a: perDayA != null ? `${fmtRp(perDayA)}/Hari` : '-',
        b: perDayB != null ? `${fmtRp(perDayB)}/Hari` : '-',
        aNum: perDayA,
        bNum: perDayB,
        better: 'lower',
        selisih: diffText(perDayA, perDayB, fmtRp),
      },
      {
        label: 'Kuota per Hari',
        a: gbPerDayA != null ? `${fmtNum(gbPerDayA)} GB/Hari` : '-',
        b: gbPerDayB != null ? `${fmtNum(gbPerDayB)} GB/Hari` : '-',
        aNum: gbPerDayA,
        bNum: gbPerDayB,
        better: 'higher',
        selisih: diffText(gbPerDayA, gbPerDayB, fmtNum),
      },
    ]
  }, [productA, productB, qtyA, qtyB])

  function swap() {
    setIdA(idB)
    setIdB(idA)
    setQtyA(qtyB)
    setQtyB(qtyA)
  }

  function reset() {
    setIdA('')
    setIdB('')
    setQtyA(1)
    setQtyB(1)
  }

  const sameProductAndQty = idA !== '' && idA === idB && qtyA === qtyB

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-2xl border border-border shadow-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          {/* Section Produk A */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-muted">Produk A</label>
            <select
              value={idA}
              onChange={(e) => setIdA(e.target.value)}
              className="input-field"
            >
              <option value="">-- Pilih Produk --</option>
              {options.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.providers?.name ? `${p.providers.name} - ` : ''}
                  {p.name} {p.kuota ? `(${p.kuota} GB)` : ''} {p.masa_aktif ? `${p.masa_aktif}H` : ''}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted font-medium">Jumlah Beli:</span>
              <div className="flex items-center border border-border rounded-xl bg-surface overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQtyA((q) => Math.max(1, q - 1))}
                  className="p-1.5 hover:bg-surface-raised text-muted hover:text-foreground transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-sm font-bold text-foreground">{qtyA}x</span>
                <button
                  type="button"
                  onClick={() => setQtyA((q) => Math.min(99, q + 1))}
                  className="p-1.5 hover:bg-surface-raised text-muted hover:text-foreground transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Button Tukar */}
          <button
            onClick={swap}
            disabled={!productA && !productB}
            title="Tukar posisi A dan B"
            className="btn-primary text-sm flex items-center justify-center gap-1.5 self-center md:self-end disabled:opacity-40 disabled:cursor-not-allowed my-2 md:my-0"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Tukar
          </button>

          {/* Section Produk B */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-muted">Produk B</label>
            <select
              value={idB}
              onChange={(e) => setIdB(e.target.value)}
              className="input-field"
            >
              <option value="">-- Pilih Produk --</option>
              {options.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.providers?.name ? `${p.providers.name} - ` : ''}
                  {p.name} {p.kuota ? `(${p.kuota} GB)` : ''} {p.masa_aktif ? `${p.masa_aktif}H` : ''}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted font-medium">Jumlah Beli:</span>
              <div className="flex items-center border border-border rounded-xl bg-surface overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQtyB((q) => Math.max(1, q - 1))}
                  className="p-1.5 hover:bg-surface-raised text-muted hover:text-foreground transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-sm font-bold text-foreground">{qtyB}x</span>
                <button
                  type="button"
                  onClick={() => setQtyB((q) => Math.min(99, q + 1))}
                  className="p-1.5 hover:bg-surface-raised text-muted hover:text-foreground transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {(productA || productB) && (
          <button
            onClick={reset}
            className="mt-3 text-sm text-danger hover:underline inline-flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Bersihkan
          </button>
        )}
      </div>

      {sameProductAndQty && (
        <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 text-sm text-warning">
          Produk dan jumlah beli A dan B sama persis. Ubah produk atau jumlah beli untuk melihat perbedaan.
        </div>
      )}

      {!metrics ? (
        <div className="bg-surface rounded-2xl border border-dashed border-border py-16 text-center">
          <GitCompareArrows className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted font-medium">Pilih dua produk untuk melihat perbandingan</p>
          <p className="text-sm text-muted/80 mt-1">
            Mendukung perbandingan jumlah beli banyak (misal: 2x Paket 7 Hari vs 1x Paket 28 Hari)
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="grid grid-cols-[1fr_1.15fr_1.15fr_1.1fr] border-b border-border bg-surface-raised/50">
            <div className="p-3 text-xs font-semibold text-muted uppercase tracking-wide">Keterangan</div>
            <div className="p-3 border-l border-border">
              <p className="text-[10px] text-muted font-bold uppercase">Produk A ({qtyA}x)</p>
              <Link
                href={`/product/${productA!.slug}`}
                className="text-sm font-semibold text-foreground hover:text-primary leading-tight line-clamp-2"
              >
                {productA!.name}
              </Link>
              {productA!.providers?.name && (
                <p className="text-xs text-muted">{productA!.providers.name}</p>
              )}
              {hasDiscount(productA!) && (
                <p className="text-xs text-success font-medium mt-0.5">Ada diskon</p>
              )}
            </div>
            <div className="p-3 border-l border-border">
              <p className="text-[10px] text-muted font-bold uppercase">Produk B ({qtyB}x)</p>
              <Link
                href={`/product/${productB!.slug}`}
                className="text-sm font-semibold text-foreground hover:text-primary leading-tight line-clamp-2"
              >
                {productB!.name}
              </Link>
              {productB!.providers?.name && (
                <p className="text-xs text-muted">{productB!.providers.name}</p>
              )}
              {hasDiscount(productB!) && (
                <p className="text-xs text-success font-medium mt-0.5">Ada diskon</p>
              )}
            </div>
            <div className="p-3 border-l border-border text-xs font-semibold text-muted uppercase tracking-wide">
              Selisih
            </div>
          </div>

          {metrics.map((m) => {
            let aWin = false
            let bWin = false
            if (m.aNum != null && m.bNum != null && m.aNum !== m.bNum && m.better !== 'none') {
              if (m.better === 'lower') aWin = m.aNum < m.bNum
              else aWin = m.aNum > m.bNum
              bWin = !aWin
            }
            return (
              <div
                key={m.label}
                className="grid grid-cols-[1fr_1.15fr_1.15fr_1.1fr] border-b border-border last:border-b-0"
              >
                <div className="p-3 text-sm font-medium text-foreground">{m.label}</div>
                <div className={`p-3 border-l border-border text-sm font-semibold ${aWin ? 'text-success' : 'text-foreground'}`}>
                  {m.a}
                  {aWin && <span className="block text-[10px] font-normal">lebih unggul</span>}
                </div>
                <div className={`p-3 border-l border-border text-sm font-semibold ${bWin ? 'text-success' : 'text-foreground'}`}>
                  {m.b}
                  {bWin && <span className="block text-[10px] font-normal">lebih unggul</span>}
                </div>
                <div className="p-3 border-l border-border text-xs text-muted self-center">{m.selisih}</div>
              </div>
            )
          })}

          <BestValue products={[productA!, productB!]} qtys={[qtyA, qtyB]} metrics={metrics} />
        </div>
      )}
    </div>
  )
}

function BestValue({
  products,
  qtys,
  metrics,
}: {
  products: [Product, Product]
  qtys: [number, number]
  metrics: Metric[]
}) {
  const score = [0, 0]
  for (const m of metrics) {
    if (m.aNum == null || m.bNum == null || m.aNum === m.bNum) continue
    if (m.better === 'none') continue
    const aBetter = m.better === 'lower' ? m.aNum < m.bNum : m.aNum > m.bNum
    if (aBetter) score[0]++
    else score[1]++
  }

  if (score[0] === 0 && score[1] === 0) return null

  const winnerIdx = score[0] === score[1] ? -1 : score[0] > score[1] ? 0 : 1
  const winner = winnerIdx === -1 ? null : products[winnerIdx]
  const winnerQty = winnerIdx === -1 ? 1 : qtys[winnerIdx]

  return (
    <div className="p-4 bg-primary/5 border-t border-border">
      {winner ? (
        <p className="text-sm text-foreground">
          <span className="font-bold text-primary">Rekomendasi:</span> Membeli {winnerQty}x{' '}
          <Link href={`/product/${winner.slug}`} className="font-semibold underline decoration-primary/40 underline-offset-2 hover:text-primary">
            {winner.name}
          </Link>{' '}
          unggul di {score[winnerIdx]} dari {metrics.filter((m) => m.aNum != null && m.bNum != null && m.better !== 'none').length} aspek perbandingan.
        </p>
      ) : (
        <p className="text-sm text-foreground">
          <span className="font-bold text-primary">Imbang:</span> kedua pilihan paket & jumlah beli sama unggul di aspek berbeda.
        </p>
      )}
    </div>
  )
}
