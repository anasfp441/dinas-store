'use client'

import { PackageGroup } from '@/types'
import { Pencil, Trash2 } from 'lucide-react'

export function AdminPackageGroupCard({
  group,
  onEdit,
  onDelete,
}: {
  group: PackageGroup
  onEdit: (g: PackageGroup) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 hover:shadow-card-hover transition-all">
      <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-foreground text-base">{group.name}</h3>
            {group.description && (
              <p className="text-xs text-muted/80 mt-0.5 line-clamp-1">{group.description}</p>
            )}
            <p className="text-xs text-muted mt-0.5">
              {group.providers?.name || '-'} · Urutan {group.sort_order}
            </p>
          </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(group)}
            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(group.id)}
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
