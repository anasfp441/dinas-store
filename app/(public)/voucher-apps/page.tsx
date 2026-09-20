import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import { PUBLIC_PRODUCT_COLUMNS } from '@/utils/product'
import { sortProductsNumerically } from '@/utils/product'
import { ProductCard } from '@/components/ProductCard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Voucher Apps - Dinas Store',
}

export default async function VoucherAppsPage() {
  const supabase = await createClient()

  // Fetch provider "Apps"
  const { data: providerData } = await supabase
    .from('providers')
    .select('id')
    .eq('slug', 'apps')
    .single()

  // Fetch categories that match
  const { data: categoryData } = await supabase
    .from('categories')
    .select('id')
    .in('slug', ['apps-premium', 'voucher-apps'])

  const providerId = providerData?.id
  const categoryIds = categoryData?.map((c) => c.id) || []

  if (!providerId) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
        <div className="bg-primary rounded-2xl p-6 mb-8 text-white shadow-card">
          <h1 className="text-3xl font-bold">Voucher Apps</h1>
        </div>
        <div className="bg-surface rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-muted font-medium">Provider "Apps" belum tersedia</p>
        </div>
      </main>
    )
  }

  let query = supabase
    .from('products')
    .select(`${PUBLIC_PRODUCT_COLUMNS}, providers(name, slug), product_categories(categories(id, name, slug))`)
    .eq('provider_id', providerId)

  // Filter by category if found
  if (categoryIds.length > 0) {
    query = query.in('product_categories.category_id', categoryIds)
  }

  const { data: rawProducts, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <p className="text-danger">Gagal memuat produk: {error.message}</p>
      </main>
    )
  }

  const products = sortProductsNumerically(
    (rawProducts || []).map((raw: any) => ({
      ...raw,
      categories: raw.product_categories?.map((pc: any) => pc.categories) || [],
    })) as Product[]
  )

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
        <h1 className="text-3xl font-bold">Voucher Apps</h1>
        <p className="text-white/80 mt-1">{products.length} produk tersedia</p>
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
          <p className="text-muted font-medium">Belum ada produk</p>
        </div>
      )}
    </main>
  )
}