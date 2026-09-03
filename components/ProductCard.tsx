import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'
import { formatPrice, hasDiscount, discountPercent, effectivePrice } from '@/utils/product'

function ProviderLogo({ product }: { product: Product }) {
  const initial = product.providers?.name?.charAt(0) || '?'
  const iconMap: Record<string, string> = {
    telkomsel: '📱',
    xl: '🟣',
    indosat: '🔵',
    axis: '🔺',
    tri: '3️⃣',
    smartfren: '🟢',
    pln: '⚡',
  }

  return (
    <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center ring-1 ring-border">
      {product.image_url ? (
        <Image
          src={product.image_url}
          alt={product.name}
          width={48}
          height={48}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-lg font-bold text-primary">
          {iconMap[product.providers?.slug || ''] || initial}
        </span>
      )}
    </div>
  )
}

export function ProductCard({ product }: { product: Product }) {
  const discount = hasDiscount(product)
  const percent = discountPercent(product)
  const price = effectivePrice(product)
  const dataLabel = product.kuota || product.nominal || ''

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group bg-surface rounded-2xl border border-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 hover:border-primary/30 transition-all p-3.5 flex items-center gap-3"
    >
      <ProviderLogo product={product} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {product.providers?.name && (
            <span className="text-[10px] text-muted">
              {product.providers.name}
            </span>
          )}
        </div>
        <h2 className="font-semibold text-foreground text-sm leading-tight truncate">
          {product.name}
        </h2>
        <p className="text-xs text-muted truncate">
          {dataLabel ? dataLabel : ''}
          {product.masa_aktif ? (dataLabel ? ' • ' : '') + product.masa_aktif : ''}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <p className="text-primary font-bold text-sm">{formatPrice(price)}</p>
          {discount && (
            <>
              <span className="text-[10px] text-muted line-through">
                {formatPrice(product.harga_jual)}
              </span>
              <span className="text-[10px] bg-danger/10 text-danger px-1.5 py-0.5 rounded-full font-bold">
                -{percent}%
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
