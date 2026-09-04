import { ProviderPageContent } from '@/components/ProviderPageContent'

export const dynamic = 'force-dynamic'

export default async function MasaAktifProviderPage({
  params,
}: {
  params: Promise<{ provider: string }>
}) {
  const { provider } = await params
  return <ProviderPageContent slug={provider} basePath="/masa-aktif" label="Masa Aktif" categorySlug="masa-aktif" />
}
