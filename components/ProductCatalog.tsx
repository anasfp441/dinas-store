'use client'

import { useMemo, useState } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { Product, Category, Provider } from '@/types'
import { effectivePrice, discountPercent } from '@/utils/product'
import { Search, X } from 'lucide-react'

export function ProductCatalog({
  products,
  categories,
  providers,
}: {
  products: Product[]
  categories: Category[]
  providers: Provider[]
}) {
  const [query, setQuery] = useState('')
  const [categorySlug, setCategorySlug] = useState('all')
  const [providerSlug, setProviderSlug] = useState('all')
  const [sort, setSort] = useState('terlaris')

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.nominal || '').toLowerCase().includes(q) ||
        (p.kuota || '').toLowerCase().includes(q) ||
        (p.masa_aktif || '').toLowerCase().includes(q) ||
        (p.providers?.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      const matchesCategory =
        categorySlug === 'all' ||
        (p.categories || []).some((c) => c.slug === categorySlug)
      const matchesProvider =
        providerSlug === 'all' || p.providers?.slug === providerSlug
      return matchesQuery && matchesCategory && matchesProvider
    })

    if (sort === 'terbaru') {
      result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sort === 'terlaris') {
      result = [...result].sort((a, b) => b.sold - a.sold)
    } else if (sort === 'termurah') {
      result = [...result].sort((a, b) => effectivePrice(a) - effectivePrice(b))
    } else if (sort === 'termahal') {
      result = [...result].sort((a, b) => effectivePrice(b) - effectivePrice(a))
    } else if (sort === 'az') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    } else if (sort === 'diskon') {
      result = [...result].sort((a, b) => discountPercent(b) - discountPercent(a))
    }

    return result
  }, [products, query, categorySlug, providerSlug, sort])

  const topSellerIds = useMemo(() => {
    return [...products]
      .filter((p) => p.sold > 0)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5)
      .map((p) => p.id)
  }, [products])

  const hasActiveFilter = query !== '' || categorySlug !== 'all' || providerSlug !== 'all'


  function resetFilters() {
    setQuery('')
    setCategorySlug('all')
    setProviderSlug('all')
  }

  return (
    <section id="produk">
      <h2 className="text-2xl font-bold text-foreground mb-6">Daftar Produk</h2>

      <div className="bg-surface rounded-2xl border border-border shadow-card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari produk, provider, nominal..."
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
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>

          <select
            value={providerSlug}
            onChange={(e) => setProviderSlug(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">Semua Product</option>
            {providers.map((p) => (
              <option key={p.id} value={p.slug}>{p.name}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input-field w-auto"
          >
            <option value="terbaru">Terbaru</option>
            <option value="terlaris">Terlaris</option>
            <option value="termurah">Termurah</option>
            <option value="termahal">Termahal</option>
            <option value="az">A-Z</option>
            <option value="diskon">Diskon</option>
          </select>

          {hasActiveFilter && (
            <button
              onClick={resetFilters}
              className="text-sm text-danger hover:underline whitespace-nowrap self-end"
            >
              Reset
            </button>
          )}
        </div>
        <div className="mt-3 text-sm text-muted">
          Menampilkan {filtered.length} dari {products.length} produk
        </div>
      </div>

      <div className="text-sm text-muted mb-4">
        {filtered.length} produk tersedia
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} isTopSeller={topSellerIds.includes(product.id)} />
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-muted font-medium">Produk tidak ditemukan</p>
          <p className="text-sm text-muted/80 mt-1">
            Coba kata kunci lain atau ubah filter
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 btn-primary text-sm"
          >
            Reset Filter
          </button>
        </div>
      )}
    </section>
  )
}
