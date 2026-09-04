import { ProviderPageContent } from '@/components/ProviderPageContent'

export const dynamic = 'force-dynamic'

export default async function PaketDataProviderPage({
  params,
}: {
  params: Promise<{ provider: string }>
}) {
  const { provider } = await params
  return <ProviderPageContent slug={provider} basePath="/paket-data" label="Paket Data" categorySlug="paket-data" />
}
