import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/ProductCard'
import { Product } from '@/types'
import { PUBLIC_PRODUCT_COLUMNS } from '@/utils/product'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!category) notFound()

  const { data: rawProducts } = await supabase
    .from('products')
    .select(
      `${PUBLIC_PRODUCT_COLUMNS},
       providers(name, slug),
       product_categories(categories(id, name, slug))`
    )
    .eq('product_categories.category_id', category.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const products = (rawProducts || []).map((raw: any) => ({
    ...raw,
    categories: raw.product_categories?.map((pc: any) => pc.categories) || [],
  })) as Product[]

  const topSellerIds = [...products]
    .filter((p) => p.sold > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5)
    .map((p) => p.id)

  return (
    <main className="container mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </Link>
      <div className="bg-primary rounded-2xl p-6 mb-8 text-white shadow-card">
        <h1 className="text-3xl font-bold">{category.name}</h1>
        <p className="text-white/80 mt-1">
          {products.length} produk tersedia di kategori ini
        </p>
      </div>
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} isTopSeller={topSellerIds.includes(product.id)} />
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-muted font-medium">Belum ada produk di kategori ini</p>
        </div>
      )}
    </main>
  )
}
