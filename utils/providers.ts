export const providers = [
  { id: 'telkomsel-id', name: 'Telkomsel', logo: '/images/providers/telkomsel.png', slug: 'telkomsel' },
  { id: 'xl-id', name: 'XL', logo: '/images/providers/xl.png', slug: 'xl' },
  { id: 'indosat-id', name: 'Indosat', logo: '/images/providers/indosat.png', slug: 'indosat' },
  { id: 'tri-id', name: 'Tri', logo: '/images/providers/tri.png', slug: 'tri' },
  { id: 'axis-id', name: 'Axis', logo: '/images/providers/axis.png', slug: 'axis' },
  { id: 'smartfren-id', name: 'Smartfren', logo: '/images/providers/smartfren.png', slug: 'smartfren' },
  { id: 'byu-id', name: 'b.yu', logo: '/images/providers/byu.png', slug: 'byu' },
]

export const validProviders: Record<string, { id: string; name: string; logo: string }> = Object.fromEntries(
  providers.map((p) => [p.slug, { id: p.id, name: p.name, logo: p.logo }])
)
