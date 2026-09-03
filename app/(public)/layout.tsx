import { Header } from '@/components/Header'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">{children}</div>
      <footer className="border-t border-border mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted">
          © {new Date().getFullYear()} Dinas Store. Produk digital terpercaya.
        </div>
      </footer>
    </div>
  )
}
