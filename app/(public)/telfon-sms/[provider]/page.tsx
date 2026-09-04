import { ProviderPageContent } from '@/components/ProviderPageContent'

export const dynamic = 'force-dynamic'

export default async function TelfonSmsProviderPage({
  params,
}: {
  params: Promise<{ provider: string }>
}) {
  const { provider } = await params
  return <ProviderPageContent slug={provider} basePath="/telfon-sms" label="Telfon & SMS" categorySlug="telfon-sms" />
}
