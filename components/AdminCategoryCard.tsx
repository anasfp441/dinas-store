'use client'

import { Category } from '@/types'
import { Pencil, Trash2 } from 'lucide-react'

export function AdminCategoryCard({ category, onEdit, onDelete }: {
  category: Category
  onEdit: (c: Category) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 hover:shadow-card-hover transition-all">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-foreground text-base">{category.name}</h3>
          <p className="text-xs text-muted mt-0.5">Slug: {category.slug}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(category.id)}
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