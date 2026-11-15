'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { AdminPageInfo } from '@/types'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  GripVertical,
} from 'lucide-react'

export default function AdminPageInfoSettingsPage() {
  const [infos, setInfos] = useState<AdminPageInfo[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminPageInfo | null>(null)
  const [formData, setFormData] = useState({ title: '', message: '', is_active: true, sort_order: 0, type: 'info', is_closed: false, closed_message: '' })

  const loadInfos = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getSupabase()
      .from('admin_page_info')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!error && data) setInfos(data as AdminPageInfo[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadInfos()
  }, [loadInfos])

  function openAdd() {
    setEditing(null)
    setFormData({ title: '', message: '', is_active: true, sort_order: infos.length + 1, type: 'info', is_closed: false, closed_message: '' })
    setModalOpen(true)
  }

  function openEdit(info: AdminPageInfo) {
    setEditing(info)
    setFormData({
      title: info.title,
      message: info.message || '',
      is_active: info.is_active,
      sort_order: info.sort_order,
      type: (info as any).type || 'info',
      is_closed: (info as any).is_closed || false,
      closed_message: (info as any).closed_message || ''
    })
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editing) {
      const { error } = await getSupabase()
        .from('admin_page_info')
        .update(formData)
        .eq('id', editing.id)
      if (!error) loadInfos()
    } else {
      const { error } = await getSupabase()
        .from('admin_page_info')
        .insert(formData)
      if (!error) loadInfos()
    }
    setModalOpen(false)
    setEditing(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus info ini?')) return
    const { error } = await getSupabase().from('admin_page_info').delete().eq('id', id)
    if (!error) loadInfos()
  }

  async function handleToggle(id: string, current: boolean) {
    const { error } = await getSupabase()
      .from('admin_page_info')
      .update({ is_active: !current })
      .eq('id', id)
    if (!error) loadInfos()
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    loadInfos()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengaturan Info Modal</h1>
          <p className="text-sm text-muted mt-0.5">
            Kelola informasi yang ditampilkan pada modal saat halaman pertama kali dibuka
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 btn-primary text-sm self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Tambah Info
        </button>
      </div>

      {loading ? (
        <div className="bg-surface rounded-2xl border border-border shadow-card p-10 text-center text-muted">
          Memuat...
        </div>
      ) : infos.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-dashed border-border py-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-muted mb-2">Belum ada info</p>
          <button onClick={openAdd} className="text-primary text-sm hover:underline">
            Tambah Info Pertama
          </button>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="divide-y divide-border">
            {infos.map((info) => (
              <div key={info.id} className="flex items-center gap-4 p-5 hover:bg-surface-raised transition-colors">
                <GripVertical className="w-5 h-5 text-muted cursor-grab" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground truncate">{info.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${info.is_active ? 'bg-success/15 text-success' : 'bg-muted/15 text-muted'}`}>
                      {info.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-sm text-muted mt-1 truncate">{info.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(info.id, info.is_active)}
                    className={`p-2 rounded-lg transition-colors ${info.is_active ? 'text-success hover:bg-success/10' : 'text-muted hover:bg-muted/10'}`}
                    title={info.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {info.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(info)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(info.id)}
                    className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Tambah/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {editing ? 'Edit Info' : 'Tambah Info Baru'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 text-muted hover:text-foreground rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Judul</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  required
                  placeholder="Contoh: Informasi Penting"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Tipe Info</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input-field"
                >
                  <option value="info">Info Modal (Home)</option>
                  <option value="closed">Info Toko Tutup</option>
                </select>
              </div>
              {formData.type === 'closed' ? (
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Pesan Toko Tutup</label>
                  <textarea
                    value={formData.closed_message}
                    onChange={(e) => setFormData({ ...formData, closed_message: e.target.value })}
                    className="input-field min-h-[60px]"
                    placeholder="Contoh: Toko sedang tutup..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Pesan</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="input-field min-h-[100px]"
                    placeholder="Contoh: Tidak terima BON/NGUTANG"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Urutan</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Aktif</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted hover:text-foreground transition-colors">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl btn-primary text-sm font-medium">
                  {editing ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}