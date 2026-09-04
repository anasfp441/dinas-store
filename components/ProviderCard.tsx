'use client'

import { useState } from 'react'
import Link from 'next/link'

export function ProviderCard({
  name,
  logo,
  href,
}: {
  name: string
  logo: string
  href: string
}) {
  const [imgError, setImgError] = useState(false)

  return (
    <Link
      href={href}
      className="group bg-surface border border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary/40 transition-all"
    >
      <div className="bg-primary/10 p-2 rounded-lg w-14 h-14 flex items-center justify-center overflow-hidden">
        {imgError ? (
          <span className="text-lg font-bold text-primary">{name.charAt(0).toUpperCase()}</span>
        ) : (
          <img
            src={logo}
            alt={name}
            onError={() => setImgError(true)}
            className="w-full h-full object-contain"
          />
        )}
      </div>
      <p className="text-xs font-medium text-foreground text-center">{name}</p>
    </Link>
  )
}
