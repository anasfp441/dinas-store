'use client'

import { useMemo, useState } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { Product, Category, Provider } from '@/types'
import { effectivePrice, discountPercent } from '@/utils/product'
import { Search, SlidersHorizontal, X } from 'lucide-react'

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
  const [showFilter, setShowFilter] = useState(false)

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

    if (sort === 'termurah') {
      result = [...result].sort((a, b) => effectivePrice(a) - effectivePrice(b))
    } else if (sort === 'termahal') {
      result = [...result].sort((a, b) => effectivePrice(b) - effectivePrice(a))
    } else if (sort === 'az') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    } else if (sort === 'diskon') {
      result = [...result].sort((a, b) => discountPercent(b) - discountPercent(a))
    } else if (sort === 'terlaris') {
      result = [...result].sort((a, b) => b.sold - a.sold)
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

  const filterCount =
    (categorySlug !== 'all' ? 1 : 0) + (providerSlug !== 'all' ? 1 : 0)
  const hasActiveFilter = query !== '' || filterCount > 0

  function resetFilters() {
    setQuery('')
    setCategorySlug('all')
    setProviderSlug('all')
    setSort('terlaris')
  }

  function chipClass(active: boolean) {
    return `px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
      active
        ? 'bg-primary text-white shadow-sm'
        : 'bg-background text-muted border border-border hover:border-primary/40 hover:text-primary'
    }`
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
              placeholder="Cari produk, provider, nominal... (contoh: pulsa 10, data 1GB)"
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

          <div className="flex gap-2 items-center">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input-field w-auto"
            >
              <option value="terbaru">Terbaru</option>
              <option value="terlaris">Terlaris</option>
              <option value="termurah">Harga Termurah</option>
              <option value="termahal">Harga Termahal</option>
              <option value="az">A-Z</option>
              <option value="diskon">Diskon Terbesar</option>
            </select>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
              {filterCount > 0 && (
                <span className="bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {filterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {showFilter && (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Kategori</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategorySlug('all')}
                  className={chipClass(categorySlug === 'all')}
                >
                  Semua
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategorySlug(c.slug)}
                    className={chipClass(categorySlug === c.slug)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            {providers.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Provider</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setProviderSlug('all')}
                    className={chipClass(providerSlug === 'all')}
                  >
                    Semua
                  </button>
                  {providers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setProviderSlug(p.slug)}
                      className={chipClass(providerSlug === p.slug)}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-sm text-muted mb-4">
        {hasActiveFilter
          ? `Menampilkan ${filtered.length} dari ${products.length} produk`
          : `${filtered.length} produk tersedia`}
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
