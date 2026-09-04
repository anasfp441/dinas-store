import { createClient } from '@/lib/supabase/server'
import { ProductCatalog } from '@/components/ProductCatalog'
import { Product, Category, Provider } from '@/types'
import { PUBLIC_PRODUCT_COLUMNS } from '@/utils/product'
import Link from 'next/link'
import { Zap, Calendar, Phone, Ticket, PlugZap, LayoutGrid, Wifi, Gift, Signal } from 'lucide-react'

export const dynamic = 'force-dynamic'

const menuItems = [
  { name: 'Pulsa', icon: Signal, href: '/pulsa' },
  { name: 'Masa Aktif', icon: Calendar, href: '/masa-aktif' },
  { name: 'Paket Data', icon: Wifi, href: '/paket-data' },
  { name: 'Kartu Perdana', icon: Gift, href: '/kartu-perdana' },
  { name: 'Telfon & SMS', icon: Phone, href: '/telfon-sms' },
  { name: 'Voucher Data', icon: Ticket, href: '/voucher-data' },
  { name: 'Token Listrik', icon: PlugZap, href: '/token-listrik' },
  { name: 'Voucher Apps', icon: LayoutGrid, href: '/voucher-apps' },
]

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

  return (
    <main className="container mx-auto px-4 py-8">
      <section className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className="group bg-surface border border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary/40 transition-all"
              >
                <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary transition-colors">
                  <Icon className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                </div>
                <p className="text-xs font-medium text-foreground text-center">{item.name}</p>
              </Link>
            )
          })}
        </div>
      </section>

      <ProductCatalog
        products={products}
        categories={categories}
        providers={providers}
      />
    </main>
  )
}
