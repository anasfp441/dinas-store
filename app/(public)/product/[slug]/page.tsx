import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import { formatPrice, hasDiscount, discountPercent, effectivePrice } from '@/utils/product'
import { ArrowLeft } from 'lucide-react'
import { BuyButton } from '@/components/BuyButton'

import { generateWaLink } from '@/utils/wa'

export const dynamic = 'force-dynamic'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      'id,provider_id,name,slug,nominal,kuota,masa_aktif,harga_modal,harga_jual,harga_diskon,description,image_url,sold,is_active,created_at,providers(name,slug),product_categories(categories(id,name,slug))'
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) notFound()

  const product = {
    ...data,
    categories: data.product_categories?.map((pc: any) => pc.categories) || [],
  } as unknown as Product

  const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER!
  const discount = hasDiscount(product)
  const percent = discountPercent(product)
  const price = effectivePrice(product)

  const dataRows: { label: string; value: string }[] = []
  if (product.nominal) dataRows.push({ label: 'Nominal', value: product.nominal })
  if (product.kuota) dataRows.push({ label: 'Paket', value: `${product.kuota} GB` })
  if (product.masa_aktif) dataRows.push({ label: 'Masa Aktif', value: `${product.masa_aktif} Hari` })
  if (product.providers?.name) dataRows.push({ label: 'Provider', value: product.providers.name })

  const message =
    `Halo, saya mau order:\n` +
    `Produk: ${product.name}\n` +
    `${product.providers?.name ? 'Provider: ' + product.providers.name + '\n' : ''}` +
    `${product.nominal ? 'Nominal: ' + product.nominal + '\n' : ''}` +
    `${product.kuota ? 'Paket: ' + product.kuota + ' GB\n' : ''}` +
    `${product.masa_aktif ? 'Masa Aktif: ' + product.masa_aktif + ' Hari\n' : ''}` +
    `Harga: ${formatPrice(price)}\n\n` +
    `Silakan kirimkan cara pembayarannya ya. Terima kasih!`

  const waLink = generateWaLink(message, waNumber)

  return (
    <main className="container mx-auto px-4 py-6 max-w-6xl">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </Link>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative h-80 w-full bg-surface border border-border rounded-2xl overflow-hidden shadow-card flex items-center justify-center">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="text-8xl">📦</div>
          )}
          {discount && (
            <span className="absolute top-4 left-4 bg-danger text-white font-bold px-3 py-1.5 rounded-full text-sm shadow-sm">
              -{percent}%
            </span>
          )}
        </div>
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {product.providers?.name && (
                <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                  {product.providers.name}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground mt-1">{product.name}</h1>
            <div className="mt-3">
              {discount ? (
                <>
                  <p className="text-3xl font-bold text-primary">{formatPrice(price)}</p>
                  <p className="text-lg text-muted line-through">{formatPrice(product.harga_jual)}</p>
                </>
              ) : (
                <p className="text-3xl font-bold text-primary">{formatPrice(product.harga_jual)}</p>
              )}
            </div>
          </div>

          {dataRows.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-4 divide-y divide-border">
              {dataRows.map((row, i) => (
                <div key={i} className="flex justify-between py-2 first:pt-0 last:pb-0">
                  <span className="text-sm text-muted">{row.label}</span>
                  <span className="text-sm font-semibold text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {(product.categories || []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.categories!.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}

          <div className="text-sm text-muted leading-relaxed whitespace-pre-line">
            {product.description}
          </div>

          <BuyButton productId={product.id} price={price} waLink={waLink} />
        </div>
      </div>
    </main>
  )
}