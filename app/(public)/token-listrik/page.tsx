import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/ProductCard'
import { Product } from '@/types'
import { PUBLIC_PRODUCT_COLUMNS, sortProductsNumerically } from '@/utils/product'

export const dynamic = 'force-dynamic'

const CATEGORY_SLUG = 'token-listrik'
const PROVIDER_SLUG = 'pln'

export default async function TokenListrikPage() {
  const supabase = await createClient()

  const [{ data: category }, { data: provider }] = await Promise.all([
    supabase.from('categories').select('*').eq('slug', CATEGORY_SLUG).single(),
    supabase.from('providers').select('*').eq('slug', PROVIDER_SLUG).single(),
  ])

  let products: Product[] = []

  if (category && provider) {
    const { data: rawProducts } = await supabase
      .from('products')
      .select(
        `${PUBLIC_PRODUCT_COLUMNS},
         providers(name, slug),
         product_categories!inner(categories(id, name, slug))`
      )
      .eq('provider_id', provider.id)
      .eq('product_categories.category_id', category.id)
      .order('created_at', { ascending: false })

    products = sortProductsNumerically(
      (rawProducts || []).map((raw: any) => ({
        ...raw,
        categories: raw.product_categories?.map((pc: any) => pc.categories) || [],
      })) as Product[]
    )
  }

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
        <h1 className="text-3xl font-bold">Token Listrik</h1>
        <p className="text-white/80 mt-1">{products.length} produk tersedia</p>
      </div>
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isTopSeller={topSellerIds.includes(product.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-muted font-medium">Belum ada produk</p>
        </div>
      )}
    </main>
  )
}
