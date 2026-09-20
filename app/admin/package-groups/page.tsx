'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { PackageGroup, Provider } from '@/types'
import { Pencil, Trash2 } from 'lucide-react'
import { AdminPackageGroupCard } from '@/components/AdminPackageGroupCard'

export default function AdminPackageGroupsPage() {
  const [groups, setGroups] = useState<PackageGroup[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [providerId, setProviderId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [editing, setEditing] = useState<PackageGroup | null>(null)
  const [filterProvider, setFilterProvider] = useState('all')

  useEffect(() => {
    loadProviders()
    loadGroups()
  }, [])

  async function loadProviders() {
    const { data } = await getSupabase().from('providers').select('*').order('name')
    if (data) setProviders(data)
  }

  async function loadGroups() {
    const { data } = await getSupabase()
      .from('package_groups')
      .select('*, providers(name, slug)')
      .order('sort_order')
      .order('name')
    if (data) setGroups(data)
  }

  function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!providerId || !name.trim()) return
    const payload = {
      provider_id: providerId,
      name: name.trim(),
      slug: slugify(name),
      description: description.trim() || null,
      sort_order: parseInt(sortOrder) || 0,
    }
    const { error } = editing
      ? await getSupabase().from('package_groups').update(payload).eq('id', editing.id)
      : await getSupabase().from('package_groups').insert(payload)
    if (!error) {
      setName('')
      setDescription('')
      setSortOrder('0')
      setEditing(null)
      loadGroups()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus grup ini? Produk yang memakai grup pindah ke Lainnya.')) return
    const { error } = await getSupabase().from('package_groups').delete().eq('id', id)
    if (!error) loadGroups()
  }

  function startEdit(g: PackageGroup) {
    setEditing(g)
    setProviderId(g.provider_id)
    setName(g.name)
    setDescription(g.description || '')
    setSortOrder(String(g.sort_order ?? 0))
  }

  function cancelEdit() {
    setEditing(null)
    setName('')
    setDescription('')
    setSortOrder('0')
  }

  const filtered = useMemo(() => {
    if (filterProvider === 'all') return groups
    return groups.filter((g) => g.provider_id === filterProvider)
  }, [groups, filterProvider])

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Grup Paket</h1>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-end gap-2 mb-6 bg-surface rounded-2xl border border-border p-4">
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-sm font-medium mb-1 text-foreground">Provider</label>
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
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-sm font-medium mb-1 text-foreground">Nama Grup</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Contoh: Paket Malam"
            required
          />
        </div>
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-sm font-medium mb-1 text-foreground">Deskripsi (Opsional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field min-h-[60px]"
            placeholder="Deskripsi grup paket..."
            rows={2}
          />
        </div>
        <div className="w-full sm:w-28">
          <label className="block text-sm font-medium mb-1 text-foreground">Urutan</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="input-field"
            placeholder="0"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button type="submit" className="btn-primary text-sm flex-1 sm:flex-none">
            {editing ? 'Simpan' : 'Tambah'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 text-sm text-muted hover:text-foreground border border-border rounded-xl"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="mb-4">
        <select
          value={filterProvider}
          onChange={(e) => setFilterProvider(e.target.value)}
          className="input-field w-full sm:w-64"
        >
          <option value="all">Semua Provider</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-dashed border-border p-6 text-center">
          <p className="text-muted font-medium">Belum ada grup paket</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filtered.map((g) => (
              <AdminPackageGroupCard
                key={g.id}
                group={g}
                onEdit={startEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          <div className="hidden md:block bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-raised border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Nama</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Deskripsi</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Provider</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Slug</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Urutan</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id} className="border-t hover:bg-surface-raised transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{g.name}</td>
                    <td className="px-4 py-3 text-muted max-w-xs truncate">{g.description || '-'}</td>
                    <td className="px-4 py-3 text-muted">{g.providers?.name || '-'}</td>
                    <td className="px-4 py-3 text-muted">{g.slug}</td>
                    <td className="px-4 py-3 text-muted">{g.sort_order}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(g)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(g.id)}
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
