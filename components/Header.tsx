'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
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
        <ThemeToggle />
      </div>
    </header>
  )
}