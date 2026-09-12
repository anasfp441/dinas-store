'use client'

import Link from 'next/link'
import { ShoppingBag, Scale } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="bg-primary p-2 rounded-xl shadow-sm group-hover:bg-primary-hover transition-colors">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Dinas Store
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/bandingkan"
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Scale className="w-4 h-4" />
            <span className="hidden sm:inline">Bandingkan</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}