'use client'

import { Provider } from '@/types'
import { Pencil, Trash2 } from 'lucide-react'

export function AdminProviderCard({ provider, onEdit, onDelete }: {
  provider: Provider
  onEdit: (p: Provider) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 hover:shadow-card-hover transition-all">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-foreground text-base">{provider.name}</h3>
          <p className="text-xs text-muted mt-0.5">Slug: {provider.slug}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(provider)}
            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(provider.id)}
            className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}