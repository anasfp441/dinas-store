'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { Provider } from '@/types'
import { Pencil, Trash2 } from 'lucide-react'
import { AdminProviderCard } from '@/components/AdminProviderCard'

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [nama, setNama] = useState('')
  const [editing, setEditing] = useState<Provider | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProviders()
  }, [])

  async function loadProviders() {
    const { data } = await getSupabase().from('providers').select('*').order('name')
    if (data) setProviders(data)
  }

  function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nama.trim()) return
    setSaving(true)
    const payload = { name: nama, slug: slugify(nama) }

    const { error } = editing
      ? await getSupabase().from('providers').update(payload).eq('id', editing.id)
      : await getSupabase().from('providers').insert(payload)

    if (!error) {
      setNama('')
      setEditing(null)
      loadProviders()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus provider ini? Produk yang menggunakan provider tidak akan dihapus.')) return
    const { error } = await getSupabase().from('providers').delete().eq('id', id)
    if (!error) loadProviders()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Penyedia (Providers)</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-end gap-2 mb-6 bg-surface rounded-2xl border border-border p-4">
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-sm font-medium mb-1 text-foreground">Nama Provider</label>
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="input-field"
            placeholder="Contoh: Telkomsel, XL, Indosat"
            required
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button type="submit" disabled={saving} className="btn-primary text-sm flex-1 sm:flex-none">
            {editing ? 'Simpan' : 'Tambah'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => { setEditing(null); setNama('') }}
              className="px-4 py-2 text-sm text-muted hover:text-foreground border border-border rounded-xl"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      {providers.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-6 text-center">
          <p className="text-muted font-medium">Belum ada provider</p>
        </div>
      ) : (
        <>
          {/* Mobile view - Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {providers.map((p) => (
              <AdminProviderCard
                key={p.id}
                provider={p}
                onEdit={(p) => { setEditing(p); setNama(p.name) }}
                onDelete={(id) => handleDelete(id)}
              />
            ))}
          </div>

          {/* Desktop view - Table */}
          <div className="hidden md:block bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-raised border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Nama</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Slug</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-surface-raised transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                    <td className="px-4 py-3 text-muted">{p.slug}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditing(p); setNama(p.name) }}
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
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}