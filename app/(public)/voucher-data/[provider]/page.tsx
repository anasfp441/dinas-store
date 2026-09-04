import { ProviderPageContent } from '@/components/ProviderPageContent'

export const dynamic = 'force-dynamic'

export default async function VoucherDataProviderPage({
  params,
}: {
  params: Promise<{ provider: string }>
}) {
  const { provider } = await params
  return <ProviderPageContent slug={provider} basePath="/voucher-data" label="Voucher Data" categorySlug="voucher-data" />
}
