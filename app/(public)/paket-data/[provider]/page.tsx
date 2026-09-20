import { ProviderPaketDataPage } from '@/components/ProviderPaketDataPage'

export const dynamic = 'force-dynamic'

export default async function PaketDataProviderPage({
  params,
}: {
  params: Promise<{ provider: string }>
}) {
  const { provider } = await params
  return <ProviderPaketDataPage slug={provider} />
}