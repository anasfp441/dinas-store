'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { Category, Product, Provider } from '@/types'
import { ProductForm } from '@/components/ProductForm'
import { AdminProductCard } from '@/components/AdminProductCard'
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react'
import { formatPrice } from '@/utils/product'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  useEffect(() => {
    loadProducts()
    loadCategories()
    loadProviders()
  }, [])

  async function loadProducts() {
    const { data } = await getSupabase()
      .from('products')
      .select(
        'id, provider_id, name, slug, nominal, kuota, masa_aktif, harga_modal, harga_jual, harga_diskon, description, image_url, sold, is_active, created_at, providers(name, slug), product_categories(categories(id, name, slug))'
      )
      .order('created_at', { ascending: false })
    const normalized = data?.map((p: any) => ({
      ...p,
      categories: p.product_categories?.map((pc: any) => pc.categories) || [],
    })) || []
    setProducts(normalized)
  }

  async function loadCategories() {
    const { data } = await getSupabase().from('categories').select('*').order('name')
    if (data) setCategories(data)
  }

  async function loadProviders() {
    const { data } = await getSupabase().from('providers').select('*').order('name')
    if (data) setProviders(data)
  }

  const [query, setQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.providers?.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.nominal || '').toLowerCase().includes(query.toLowerCase())
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' ? p.is_active : !p.is_active)
      return matchesQuery && matchesStatus
    })
  }, [products, query, filterStatus])

  async function handleDelete(id: string) {
    if (!confirm('Hapus produk ini?')) return
    const { error } = await getSupabase().from('products').delete().eq('id', id)
    if (!error) loadProducts()
  }

  function openAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    loadProducts()
  }

  function resetFilters() {
    setQuery('')
    setFilterStatus('all')
  }

  const hasFilter = query !== '' || filterStatus !== 'all'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Daftar Produk</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 btn-primary text-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Produk
        </button>
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari produk / provider / nominal..."
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
          {hasFilter && (
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {editing ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 text-muted hover:text-foreground rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <ProductForm
                product={editing}
                categories={categories}
                providers={providers}
                initialCategoryIds={editing?.categories?.map((c) => c.id) || []}
                onDone={closeModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile view - Cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filtered.map((p) => (
          <AdminProductCard
            key={p.id}
            product={p}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        ))}
        {filtered.length === 0 && (
          <div className="bg-surface rounded-2xl border border-dashed border-border py-12 text-center">
            <p className="text-muted mb-2">Produk tidak ditemukan</p>
            {hasFilter && (
              <button
                onClick={resetFilters}
                className="text-primary text-sm hover:underline"
              >
                Reset filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop view - Table */}
      <div className="hidden md:block bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Produk</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Kategori</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Modal</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Harga</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Diskon</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Terjual</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t hover:bg-surface-raised transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">
                  {p.name}
                  <div className="text-xs text-muted">
                    {p.providers?.name || '-'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(p.categories || []).length > 0 ? (
                      p.categories!.map((c) => (
                        <span key={c.id} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {c.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-muted text-xs">
                  {formatPrice(p.harga_modal)}
                </td>
                <td className="px-4 py-3 font-mono text-foreground">
                  {formatPrice(p.harga_jual)}
                </td>
                <td className="px-4 py-3">
                  {p.harga_diskon ? (
                    <span className="text-success font-medium">
                      {formatPrice(p.harga_diskon)}
                    </span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-muted">{p.sold}</span>
                </td>
                <td className="px-4 py-3">
                  {p.is_active ? (
                    <span className="text-success font-bold">✓ Aktif</span>
                  ) : (
                    <span className="text-danger">✗ Nonaktif</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <p className="text-muted mb-2">Produk tidak ditemukan</p>
                  {hasFilter && (
                    <button
                      onClick={resetFilters}
                      className="text-primary text-sm hover:underline"
                    >
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
