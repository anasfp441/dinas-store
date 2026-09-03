'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { Category } from '@/types'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<Category | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    const { data } = await getSupabase()
      .from('categories')
      .select('*')
      .order('name')
    if (data) setCategories(data)
  }

  function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { name, slug: slugify(name) }
    const { error } = editing
      ? await getSupabase().from('categories').update(payload).eq('id', editing.id)
      : await getSupabase().from('categories').insert(payload)
    if (!error) {
      setName('')
      setEditing(null)
      loadCategories()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus kategori ini?')) return
    const { error } = await getSupabase().from('categories').delete().eq('id', id)
    if (!error) loadCategories()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Daftar Kategori</h1>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 mb-6 bg-surface rounded-2xl border border-border p-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1 text-foreground">Nama Kategori</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Nama kategori"
            required
          />
        </div>
        <button type="submit" className="btn-primary text-sm">
          {editing ? 'Simpan' : 'Tambah'}
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => { setEditing(null); setName('') }}
            className="text-sm text-muted hover:text-foreground"
          >
            Batal
          </button>
        )}
      </form>

      <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Nama</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Slug</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t hover:bg-surface-raised transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                <td className="px-4 py-3 text-muted">{c.slug}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditing(c); setName(c.name) }}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
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
    </div>
  )
}