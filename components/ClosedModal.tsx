'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { StoreSnapshot } from 'lucide-react'

export function ClosedModal() {
  const [infos, setInfos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInfos = async () => {
      const { data } = await getSupabase()
        .from('admin_page_info')
        .select('*')
        .eq('is_active', true)
        .eq('is_closed', true)
        .order('sort_order', { ascending: true })

      if (data) setInfos(data)
      setLoading(false)
    }
    fetchInfos()
  }, [])

  if (loading || infos.length === 0) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md text-center p-8 border border-border space-y-4">
        <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          🔒
        </div>
        <h2 className="text-2xl font-bold text-foreground">Toko Sedang Tutup</h2>
        {infos.map((info) => (
          <p key={info.id} className="text-muted text-sm leading-relaxed whitespace-pre-line">
            {info.closed_message || 'Toko sedang tutup. Silakan kembali lagi nanti.'}
          </p>
        ))}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted">Mohon maaf atas ketidaknyamanannya.</p>
        </div>
      </div>
    </div>
  )
}
