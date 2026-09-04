import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProviderCard } from '@/components/ProviderCard'
import { providers } from '@/utils/providers'

export const metadata = {
  title: 'Masa Aktif - Dinas Store',
}

export default function MasaAktifPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </Link>
      <div className="bg-primary rounded-2xl p-6 mb-8 text-white shadow-card">
        <h1 className="text-3xl font-bold">Masa Aktif</h1>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {providers.map((provider) => (
          <ProviderCard
            key={provider.name}
            name={provider.name}
            logo={provider.logo}
            href={`/masa-aktif/${provider.slug}`}
          />
        ))}
      </div>
      <div className="bg-surface rounded-2xl border border-dashed border-border py-16 text-center">
        <p className="text-muted font-medium">Halaman dalam pengembangan</p>
      </div>
    </main>
  )
}
