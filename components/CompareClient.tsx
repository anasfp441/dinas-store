'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Product } from '@/types'
import { effectivePrice, formatPrice, hasDiscount } from '@/utils/product'
import { ArrowLeftRight, GitCompareArrows, Trash2 } from 'lucide-react'

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

    const priceA = effectivePrice(productA)
    const priceB = effectivePrice(productB)
    const quotaA = getQuotaGB(productA)
    const quotaB = getQuotaGB(productB)
    const daysA = getDays(productA)
    const daysB = getDays(productB)

    const perGbA = quotaA != null ? priceA / quotaA : null
    const perGbB = quotaB != null ? priceB / quotaB : null
    const perDayA = daysA != null ? priceA / daysA : null
    const perDayB = daysB != null ? priceB / daysB : null
    const gbPerDayA = quotaA != null && daysA != null ? quotaA / daysA : null
    const gbPerDayB = quotaB != null && daysB != null ? quotaB / daysB : null

    const fmtRp = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`
    const fmtGb = (n: number) => `${Number(n.toFixed(2)).toLocaleString('id-ID')} GB`
    const fmtDay = (n: number) => `${Number(n.toFixed(1)).toLocaleString('id-ID')} Hari`
    const fmtNum = (n: number) => Number(n.toFixed(2)).toLocaleString('id-ID')

    return [
      {
        label: 'Harga',
        a: formatPrice(priceA),
        b: formatPrice(priceB),
        aNum: priceA,
        bNum: priceB,
        better: 'lower',
        selisih: diffText(priceA, priceB, fmtRp),
      },
      {
        label: 'Kuota Data',
        a: quotaA != null ? fmtGb(quotaA) : '-',
        b: quotaB != null ? fmtGb(quotaB) : '-',
        aNum: quotaA,
        bNum: quotaB,
        better: 'higher',
        selisih: diffText(quotaA, quotaB, fmtGb),
      },
      {
        label: 'Masa Aktif',
        a: daysA != null ? `${fmtNum(daysA)} Hari` : '-',
        b: daysB != null ? `${fmtNum(daysB)} Hari` : '-',
        aNum: daysA,
        bNum: daysB,
        better: 'higher',
        selisih: diffText(daysA, daysB, fmtDay),
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
  }, [productA, productB])

  function swap() {
    setIdA(idB)
    setIdB(idA)
  }

  function reset() {
    setIdA('')
    setIdB('')
  }

  const sameProduct = idA !== '' && idA === idB

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-2xl border border-border shadow-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Produk A</label>
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
          </div>

          <button
            onClick={swap}
            disabled={!productA && !productB}
            title="Tukar posisi A dan B"
            className="btn-primary text-sm flex items-center gap-1.5 self-end disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Tukar
          </button>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Produk B</label>
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

      {sameProduct && (
        <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 text-sm text-warning">
          Produk A dan B sama. Pilih dua produk berbeda untuk membandingkan.
        </div>
      )}

      {!metrics || sameProduct ? (
        <div className="bg-surface rounded-2xl border border-dashed border-border py-16 text-center">
          <GitCompareArrows className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted font-medium">Pilih dua produk untuk melihat perbandingan</p>
          <p className="text-sm text-muted/80 mt-1">
            Hasil: selisih harga, kuota, masa aktif, harga per GB, harga per hari, kuota per hari
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="grid grid-cols-[1fr_1.15fr_1.15fr_1.1fr] border-b border-border bg-surface-raised/50">
            <div className="p-3 text-xs font-semibold text-muted uppercase tracking-wide">Keterangan</div>
            <div className="p-3 border-l border-border">
              <p className="text-[10px] text-muted font-bold uppercase">Produk A</p>
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
              <p className="text-[10px] text-muted font-bold uppercase">Produk B</p>
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

          <BestValue products={[productA!, productB!]} metrics={metrics} />
        </div>
      )}
    </div>
  )
}

function BestValue({
  products,
  metrics,
}: {
  products: [Product, Product]
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

  return (
    <div className="p-4 bg-primary/5 border-t border-border">
      {winner ? (
        <p className="text-sm text-foreground">
          <span className="font-bold text-primary">Rekomendasi:</span>{' '}
          <Link href={`/product/${winner.slug}`} className="font-semibold underline decoration-primary/40 underline-offset-2 hover:text-primary">
            {winner.name}
          </Link>{' '}
          unggul di {score[winnerIdx]} dari {metrics.filter((m) => m.aNum != null && m.bNum != null).length} aspek perbandingan.
        </p>
      ) : (
        <p className="text-sm text-foreground">
          <span className="font-bold text-primary">Imbang:</span> kedua produk sama unggul di aspek berbeda.
        </p>
      )}
    </div>
  )
}
