'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { Product, PackageGroup } from '@/types'
import { kuotaInRange, KUOTA_RANGES, priceInRange, PRICE_RANGES } from '@/utils/product'

interface ProviderPaketDataClientProps {
  provider: { id: string; name: string; slug: string }
  packageGroups: PackageGroup[]
  products: Product[]
}

export function ProviderPaketDataClient({
  provider,
  packageGroups,
  products: allProducts,
}: ProviderPaketDataClientProps) {
  const [selectedMasaAktif, setSelectedMasaAktif] = useState<string>('all')
  const [selectedKuota, setSelectedKuota] = useState<string>('all')
  const [selectedPrice, setSelectedPrice] = useState<string>('all')

  // Get unique masa_aktif values from products
  const masaAktifOptions = useMemo(() => {
    const values = new Set<string>()
    allProducts.forEach((p) => {
      if (p.masa_aktif) values.add(p.masa_aktif)
    })
    return Array.from(values).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0
      return numA - numB
    })
  }, [allProducts])

  // Filter products by masa_aktif and kuota range
  const products = useMemo(() => {
    return allProducts.filter((p) => {
      const matchMasaAktif = selectedMasaAktif === 'all' || p.masa_aktif === selectedMasaAktif
      const matchKuota = kuotaInRange(p, selectedKuota)
      const matchPrice = priceInRange(p, selectedPrice)
      return matchMasaAktif && matchKuota && matchPrice
    })
  }, [allProducts, selectedMasaAktif, selectedKuota, selectedPrice])

  // Count top sellers
  const topSellerIds = useMemo(
    () =>
      [...products]
        .filter((p) => p.sold > 0)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5)
        .map((p) => p.id),
    [products]
  )

  // Group products by package_group
  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>()
    const ungrouped: Product[] = []
    products.forEach((p) => {
      const groupId = p.package_group?.id || '__ungrouped__'
      if (groupId === '__ungrouped__') {
        ungrouped.push(p)
      } else {
        const arr = map.get(groupId) || []
        arr.push(p)
        map.set(groupId, arr)
      }
    })
    return { map, ungrouped }
  }, [products])

  const sortedGroups = packageGroups.filter((g) => grouped.map.has(g.id))

  return (
    <main className="container mx-auto px-4 py-8">
      <Link
        href="/paket-data"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </Link>

      <div className="bg-primary rounded-2xl p-6 mb-6 text-white shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Paket Data {provider.name}
          </h1>
          <p className="text-white/80 mt-1">{products.length} produk tersedia</p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          {/* Filter Kuota Range */}
          <select
            value={selectedKuota}
            onChange={(e) => setSelectedKuota(e.target.value)}
            className="bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
          >
            <option value="all" className="bg-surface text-foreground">Semua Kuota</option>
            {KUOTA_RANGES.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-surface text-foreground">{opt.label}</option>
            ))}
          </select>

          {/* Filter Harga Range */}
          <select
            value={selectedPrice}
            onChange={(e) => setSelectedPrice(e.target.value)}
            className="bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
          >
            <option value="all" className="bg-surface text-foreground">Semua Harga</option>
            {PRICE_RANGES.filter((r) => r.value !== 'all').map((r) => (
              <option key={r.value} value={r.value} className="bg-surface text-foreground">{r.label}</option>
            ))}
          </select>

          {/* Filter Masa Aktif Dinamis */}
          {masaAktifOptions.length > 0 && (
            <select
              value={selectedMasaAktif}
              onChange={(e) => setSelectedMasaAktif(e.target.value)}
              className="bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
            >
              <option value="all" className="bg-surface text-foreground">Semua Masa Aktif</option>
              {masaAktifOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-surface text-foreground">{opt}</option>
              ))}
            </select>
          )}

          {/* Reset Button */}
          {(selectedMasaAktif !== 'all' || selectedKuota !== 'all' || selectedPrice !== 'all') && (
            <button
              onClick={() => {
                setSelectedMasaAktif('all')
                setSelectedKuota('all')
                setSelectedPrice('all')
              }}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/20 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {products.length > 0 ? (
        <>
          {sortedGroups.map((g) => {
            const list = grouped.map.get(g.id) || []
            return (
              <section key={g.id} className="mb-10">
                <div className="flex items-baseline justify-between gap-4 mb-2 pb-3 border-b border-border">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {g.name}
                  </h2>
                  <span className="text-sm text-muted whitespace-nowrap">{list.length} produk</span>
                </div>
                {g.description && (
                  <p className="text-muted text-sm mb-4 line-clamp-3 whitespace-pre-line">{g.description}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                  {list.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isTopSeller={topSellerIds.includes(product.id)}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          {grouped.ungrouped.length > 0 && (
            <section className="mb-10">
              <div className="flex items-baseline justify-between gap-4 mb-2 pb-3 border-b border-border">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted" />
                  Lainnya
                </h2>
                <span className="text-sm text-muted whitespace-nowrap">{grouped.ungrouped.length} produk</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {grouped.ungrouped.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isTopSeller={topSellerIds.includes(product.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="bg-surface rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-muted font-medium">Belum ada produk</p>
          {(selectedMasaAktif !== 'all' || selectedKuota !== 'all') && (
            <button
              onClick={() => {
                setSelectedMasaAktif('all')
                setSelectedKuota('all')
              }}
              className="mt-3 text-sm text-primary hover:underline font-medium"
            >
              Reset filter
            </button>
          )}
        </div>
      )}
    </main>
  )
}
