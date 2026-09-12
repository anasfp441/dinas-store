import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import { PUBLIC_PRODUCT_COLUMNS } from '@/utils/product'
import { CompareClient } from '@/components/CompareClient'

export const metadata = {
  title: 'Bandingkan Produk - Dinas Store',
}

export const dynamic = 'force-dynamic'

async function getProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`${PUBLIC_PRODUCT_COLUMNS}, providers(name, slug)`)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Error fetching products:', error)
    return []
  }
  return (data || []).map((raw: any) => ({
    ...raw,
    categories: [],
  }))
}

export default async function BandingkanPage() {
  const products = await getProducts()

  return (
    <main className="container mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </Link>
      <div className="bg-primary rounded-2xl p-6 mb-8 text-white shadow-card">
        <h1 className="text-3xl font-bold">Bandingkan Produk</h1>
        <p className="text-white/80 text-sm mt-1">
          Bandingkan dua paket: selisih harga, kuota, masa aktif, harga per GB, dan kuota per hari
        </p>
      </div>
      <CompareClient products={products} />
    </main>
  )
}
