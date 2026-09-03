'use client'

import { Product, Provider } from '@/types'
import { formatPrice } from '@/utils/product'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

export function AdminProductCard({ product, onEdit, onDelete }: {
  product: Product
  onEdit: (p: Product) => void
  onDelete: (id: string) => void
}) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Hapus produk ini?')) return
    setDeleting(true)
    onDelete(product.id)
  }

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 hover:shadow-card-hover transition-all">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-medium text-foreground text-base">{product.name}</h3>
          <p className="text-xs text-muted mt-0.5">{product.providers?.name || '-'}</p>
          
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
            <div>
              <span className="text-muted">Kategori:</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {(product.categories || []).length > 0 ? (
                  product.categories!.map(c => (
                    <span key={c.id} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {c.name}
                    </span>
                  ))
                ) : (
                  <span className="text-muted">-</span>
                )}
              </div>
            </div>
            
            <div>
              <span className="text-muted">Modal:</span>
              <span className="font-mono text-muted ml-1.5">{formatPrice(product.harga_modal)}</span>
            </div>
            
            <div>
              <span className="text-muted">Harga:</span>
              <span className="font-mono text-foreground ml-1.5">{formatPrice(product.harga_jual)}</span>
              {product.harga_diskon && (
                <>
                  <span className="text-success ml-2 font-medium">{formatPrice(product.harga_diskon)}</span>
                </>
              )}
            </div>
            
            <div>
              <span className="text-muted">Terjual:</span>
              <span className="text-muted ml-1.5">{product.sold}</span>
            </div>
            
            <div>
              <span className="text-muted">Status:</span>
              <span className={`ml-1.5 font-medium ${product.is_active ? 'text-success' : 'text-danger'}`}>
                {product.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(product)}
            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
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