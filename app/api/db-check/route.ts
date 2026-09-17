import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const [categories, providers, products] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('providers').select('*'),
    supabase.from('products').select('id, name, slug, is_active'),
  ])
  return NextResponse.json({
    categories: { count: categories.data?.length ?? 0, rows: categories.data, error: categories.error?.message },
    providers: { count: providers.data?.length ?? 0, rows: providers.data, error: providers.error?.message },
    products: { count: products.data?.length ?? 0, rows: products.data, error: products.error?.message },
  })
}
