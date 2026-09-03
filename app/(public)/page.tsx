import { createClient } from '@/lib/supabase/server'
import { ProductCatalog } from '@/components/ProductCatalog'
import { Product, Category, Provider } from '@/types'
import { PUBLIC_PRODUCT_COLUMNS } from '@/utils/product'
import Link from 'next/link'
import { Zap, Server, Package, BadgeCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

const categories_icons: Record<string, any> = {
  pulsa: Zap,
  listrik: Server,
  'paket-data': Package,
  'apps-premium': BadgeCheck,
}

const category_order: Record<string, number> = {
  pulsa: 0,
  'paket-data': 1,
  'token-listrik': 2,
  'apps-premium': 3,
}

async function getProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(
      `${PUBLIC_PRODUCT_COLUMNS},
       providers(name, slug),
       product_categories(categories(id, name, slug))`
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Error fetching products:', error)
    return []
  }
  return (data || []).map(normalizeProduct)
}

async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  return data || []
}

async function getProviders(): Promise<Provider[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .order('name')
  if (error) {
    console.error('Error fetching providers:', error)
    return []
  }
  return data || []
}

function normalizeProduct(raw: any): Product {
  return {
    ...raw,
    categories: raw.product_categories?.map((pc: any) => pc.categories) || [],
  }
}

export default async function CatalogPage() {
  const [products, categories, providers] = await Promise.all([
    getProducts(),
    getCategories(),
    getProviders(),
  ])

  const sortedCategories = [...categories].sort(
    (a, b) => (category_order[a.slug] ?? 99) - (category_order[b.slug] ?? 99)
  )

  return (
    <main className="container mx-auto px-4 py-8">
      {categories.length > 0 && (
        <section className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {sortedCategories.map((category) => {
              const Icon = categories_icons[category.slug] || Package
              return (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="group bg-surface border border-border rounded-2xl p-4 flex items-center gap-3 hover:border-primary/40 hover:shadow-card-hover transition-all"
                >
                  <div className="bg-primary/10 p-2.5 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{category.name}</p>
                    <p className="text-xs text-muted">Lihat produk</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <ProductCatalog
        products={products}
        categories={categories}
        providers={providers}
      />
    </main>
  )
}
