import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import { PUBLIC_PRODUCT_COLUMNS } from '@/utils/product'
import { sortProductsNumerically } from '@/utils/product'
import { ProviderPaketDataClient } from '@/components/ProviderPaketDataClient'

export async function ProviderPaketDataPage({
  slug,
}: {
  slug: string
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

  // Fetch package groups for this provider
  const { data: packageGroups } = await supabase
    .from('package_groups')
    .select('*')
    .eq('provider_id', provider.id)
    .order('sort_order')
    .order('name')

  // Fetch products for this provider & category paket-data
  const { data: categoryData } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'paket-data')
    .single()

  const categoryId = categoryData?.id

  const categoriesEmbed = categoryId
    ? 'product_categories!inner(categories(id, name, slug))'
    : 'product_categories(categories(id, name, slug))'

  let query = supabase
    .from('products')
    .select(`${PUBLIC_PRODUCT_COLUMNS}, providers(name, slug), package_groups(id, name, slug, description), ${categoriesEmbed}`)
    .eq('provider_id', provider.id)

  if (categoryId) {
    query = query.eq('product_categories.category_id', categoryId)
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
    package_group: raw.package_groups || null,
    categories: raw.product_categories?.map((pc: any) => pc.categories) || [],
  })) as Product[]

  products = sortProductsNumerically(products)

  return (
    <ProviderPaketDataClient
      provider={provider}
      packageGroups={packageGroups || []}
      products={products}
    />
  )
}
