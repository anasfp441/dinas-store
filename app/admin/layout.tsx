'use client'

import Link from 'next/link'
import { getSupabase } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Menu, X } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await getSupabase().auth.getSession()
      if (!session) {
        router.push('/admin/login')
        return
      }
      const { data } = await getSupabase()
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (!data || data.role !== 'admin') {
        router.push('/admin/login')
        return
      }
      setProfile(data)
    }
    checkSession()
  }, [router])

  const nav = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/products', label: 'Produk' },
    { href: '/admin/bills', label: 'Pesanan' },
    { href: '/admin/reports', label: 'Laporan' },
    { href: '/admin/categories', label: 'Kategori' },
    { href: '/admin/providers', label: 'Provider' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 bg-surface/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="sm:hidden p-2 rounded-lg text-muted hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/admin" className="font-bold text-lg text-foreground">Admin</Link>
          <nav className={`${mobileMenuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row gap-1 sm:gap-3 absolute left-0 top-full w-full sm:w-auto bg-surface border-b sm:border-0 border-border sm:rounded-xl p-3 sm:p-0 shadow-lg sm:shadow-none`}>
            {nav.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 sm:py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:text-foreground hover:bg-background'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted hidden sm:inline">{profile?.full_name}</span>
          <ThemeToggle />
          <button
            onClick={async () => {
              await getSupabase().auth.signOut()
              router.push('/admin/login')
            }}
            className="text-sm text-danger hover:underline"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="p-4 sm:p-6">{children}</main>
    </div>
  )
}
