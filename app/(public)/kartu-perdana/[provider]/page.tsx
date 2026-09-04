import { ProviderPageContent } from '@/components/ProviderPageContent'

export const dynamic = 'force-dynamic'

export default async function KartuPerdanaProviderPage({
  params,
}: {
  params: Promise<{ provider: string }>
}) {
  const { provider } = await params
  return <ProviderPageContent slug={provider} basePath="/kartu-perdana" label="Kartu Perdana" categorySlug="kartu-perdana" />
}
