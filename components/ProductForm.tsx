'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { Category, Product, Provider } from '@/types'
import Image from 'next/image'

export function ProductForm({
  product,
  categories,
  providers,
  initialCategoryIds,
  onDone,
}: {
  product?: Product | null
  categories: Category[]
  providers: Provider[]
  initialCategoryIds: string[]
  onDone: () => void
}) {
  const [providerId, setProviderId] = useState(product?.provider_id ?? '')
  const [name, setName] = useState(product?.name ?? '')
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategoryIds)
  const [kuota, setKuota] = useState(product?.kuota ?? '')
  const [masaAktif, setMasaAktif] = useState(product?.masa_aktif ?? '')
  const [hargaModal, setHargaModal] = useState(product?.harga_modal?.toString() ?? '')
  const [hargaJual, setHargaJual] = useState(product?.harga_jual?.toString() ?? '')
  const [hargaDiskon, setHargaDiskon] = useState(product?.harga_diskon?.toString() ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [logoOptions, setLogoOptions] = useState<string[]>([])

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data } = await getSupabase()
        .from('products')
        .select('image_url')
        .not('image_url', 'is', null)
      if (!active) return
      const seen = new Set<string>()
      const list: string[] = []
      for (const row of data || []) {
        const url = row.image_url as string | null
        if (url && !seen.has(url)) {
          seen.add(url)
          list.push(url)
        }
      }
      setLogoOptions(list)
    })()
    return () => {
      active = false
    }
  }, [])

  function slugify(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
  }

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const { error: uploadError } = await getSupabase().storage
      .from('products')
      .upload(fileName, file)
    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }
    const { data: urlData } = getSupabase().storage
      .from('products')
      .getPublicUrl(fileName)
    setImageUrl(urlData.publicUrl)
    setUploading(false)
  }

  function pickLogo(url: string) {
    setImageUrl(url)
  }

  function clearLogo() {
    setImageUrl('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!providerId) {
      setError('Provider wajib dipilih')
      return
    }
    if (!name.trim()) {
      setError('Nama produk wajib diisi')
      return
    }
    if (!hargaJual) {
      setError('Harga jual wajib diisi')
      return
    }

    const modal = parseInt(hargaModal) || 0
    const jual = parseInt(hargaJual) || 0
    const diskon = hargaDiskon ? parseInt(hargaDiskon) : null

    const providerName = providers.find((p) => p.id === providerId)?.name ?? ''
    const slugBase = providerName ? `${providerName} ${name.trim()}` : name.trim()

    const payload = {
      provider_id: providerId,
      name: name.trim(),
      slug: slugify(slugBase),
      kuota: kuota || null,
      masa_aktif: masaAktif || null,
      harga_modal: modal,
      harga_jual: jual,
      harga_diskon:
        diskon && diskon > 0 && diskon < jual ? diskon : null,
      description: description || null,
      image_url: imageUrl || null,
      is_active: isActive,
    }

    let productId = product?.id

    if (productId) {
      const { error: dbError } = await getSupabase()
        .from('products')
        .update(payload)
        .eq('id', productId)
      if (dbError) {
        setError(dbError.message)
        return
      }
    } else {
      const { data, error: dbError } = await getSupabase()
        .from('products')
        .insert(payload)
        .select('id')
        .single()
      if (dbError) {
        setError(dbError.message)
        return
      }
      productId = data.id
    }

    if (productId) {
      const sb = getSupabase()
      await sb.from('product_categories').delete().eq('product_id', productId)
      const validIds = selectedCategories.filter((cid) => cid && cid.trim() !== '')
      if (validIds.length > 0) {
        const { error: catError } = await sb.from('product_categories').insert(
          validIds.map((cid) => ({ product_id: productId, category_id: cid }))
        )
        if (catError) {
          setError(catError.message)
          return
        }
      }
    }

    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-danger text-sm bg-danger/10 rounded-lg px-3 py-2">{error}</p>}

      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">Provider *</label>
        <select
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          className="input-field"
          required
        >
          <option value="">Pilih provider</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">Nama Produk *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
          placeholder="Contoh: Pulsa 10.000"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">Kategori (bisa pilih lebih dari satu)</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const checked = selectedCategories.includes(c.id)
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => toggleCategory(c.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  checked
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface text-muted border-border hover:border-primary/40 hover:text-primary'
                }`}
              >
                {c.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">Kuota / Paket</label>
          <input
            value={kuota}
            onChange={(e) => setKuota(e.target.value)}
            className="input-field"
            placeholder="Contoh: 1 GB"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">Masa Aktif</label>
          <input
            value={masaAktif}
            onChange={(e) => setMasaAktif(e.target.value)}
            className="input-field"
            placeholder="Contoh: 30 Hari"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">
            Harga Modal (Rp)
            <span className="text-xs text-danger font-normal"> — hanya admin</span>
          </label>
          <input
            type="number"
            value={hargaModal}
            onChange={(e) => setHargaModal(e.target.value)}
            className="input-field bg-warning/10"
            placeholder="10000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">Harga Jual (Rp) *</label>
          <input
            type="number"
            value={hargaJual}
            onChange={(e) => setHargaJual(e.target.value)}
            className="input-field"
            placeholder="12000"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">Harga Diskon (Rp)</label>
          <input
            type="number"
            value={hargaDiskon}
            onChange={(e) => setHargaDiskon(e.target.value)}
            className="input-field"
            placeholder="Kosongkan jika tanpa diskon"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">Deskripsi</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-field min-h-[80px]"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-foreground">Logo</label>
        {imageUrl && (
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
              <img src={imageUrl} alt="logo" className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={clearLogo}
              className="text-xs text-danger hover:underline"
            >
              Hapus logo
            </button>
          </div>
        )}
        {logoOptions.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted mb-2">Pilih logo yang sudah dipakai</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {logoOptions.map((url) => {
                const selected = url === imageUrl
                return (
                  <button
                    type="button"
                    key={url}
                    onClick={() => pickLogo(url)}
                    className={`relative aspect-square rounded-lg overflow-hidden border transition-all ${
                      selected
                        ? 'border-primary ring-2 ring-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                    title="Pilih logo ini"
                  >
                    <Image
                      src={url}
                      alt="logo"
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <p className="text-xs text-muted mb-2">Atau upload logo baru</p>
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="text-sm"
        />
        {uploading && <p className="text-sm text-muted mt-1">Mengunggah...</p>}
      </div>

      <div className="flex items-end">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded border-border bg-surface"
          />
          <span className="text-sm font-medium text-foreground">Aktif / Tampil</span>
        </label>
      </div>

      <button
        type="submit"
        className="btn-primary w-full mt-2"
      >
        {product ? 'Simpan Perubahan' : 'Tambah Produk'}
      </button>
    </form>
  )
}
