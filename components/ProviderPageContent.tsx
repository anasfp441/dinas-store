import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/ProductCard'
import { Product } from '@/types'
import { PUBLIC_PRODUCT_COLUMNS } from '@/utils/product'
import { sortProductsNumerically } from '@/utils/product'

export async function ProviderPageContent({
  slug,
  basePath,
  label,
  categorySlug,
}: {
  slug: string
  basePath: string
  label: string
  categorySlug?: string
}) {
  const supabase = await createClient()

  // Fetch provider from DB
  const { data: providerData, error: providerError } = await supabase
    .from('providers')
    .select('*')
    .eq('slug', slug)
    .single()

  if (providerError || !providerData) {
    notFound()
  }

  const provider = providerData as { id: string; name: string; slug: string }

  // Fetch category from DB
  let category = null
  if (categorySlug) {
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', categorySlug)
      .single()

    if (categoryError) notFound()
    category = categoryData as { id: string; name: string; slug: string }
  }

  // Build products query
  const categoriesEmbed = category
    ? 'product_categories!inner(categories(id, name, slug))'
    : 'product_categories(categories(id, name, slug))'

  let query = supabase
    .from('products')
    .select(`${PUBLIC_PRODUCT_COLUMNS}, providers(name, slug), ${categoriesEmbed}`)
    .eq('is_active', true)

  // Filter by provider_id (using provider's DB id)
  query = query.eq('provider_id', provider.id)

  // Filter by category if provided
  if (category) {
    query = query.eq('product_categories.category_id', category.id)
  }

  const { data: rawProducts, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return (
      <main className="container mx-auto px-4 py-8">
        <p className="text-danger">Gagal memuat produk: {error.message}</p>
      </main>
    )
  }

  // Map to Product type and apply numerical sorting
  let products: Product[] = (rawProducts || []).map((raw: any) => ({
    ...raw,
    categories: raw.product_categories?.map((pc: any) => pc.categories) || [],
  })) as Product[]

  products = sortProductsNumerically(products)

  // Count top sellers
  const topSellerIds = [...products]
    .filter((p) => p.sold > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5)
    .map((p) => p.id)

  return (
    <main className="container mx-auto px-4 py-8">
      <Link
        href={basePath}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </Link>
      <div className="bg-primary rounded-2xl p-6 mb-8 text-white shadow-card">
        <h1 className="text-3xl font-bold">
          {label} {provider.name}
        </h1>
        {category && <p className="text-white/80 mt-1">{products.length} produk tersedia di kategori {category.name}</p>}
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
          {category && <p className="text-muted/80 mt-1">di kategori {category.name}</p>}
        </div>
      )}
    </main>
  )
}