'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { AdminPageInfo } from '@/types'
import { X } from 'lucide-react'

export function InfoModal() {
  const [infos, setInfos] = useState<AdminPageInfo[]>([])
  const [show, setShow] = useState(false)

  useEffect(() => {
    const fetchInfos = async () => {
      const { data } = await getSupabase()
        .from('admin_page_info')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (data && data.length > 0) {
        setInfos(data as AdminPageInfo[])
        // Hanya tampilkan jika belum pernah ditutup di session ini
        if (!sessionStorage.getItem('info_modal_closed')) {
          setShow(true)
        }
      }
    }
    fetchInfos()
  }, [])

  const handleClose = () => {
    setShow(false)
    sessionStorage.setItem('info_modal_closed', 'true')
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Informasi Toko</h2>
          <button onClick={handleClose} className="p-1 text-muted hover:text-foreground rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {infos.map((info) => (
            <div key={info.id}>
              <h3 className="font-semibold text-foreground">{info.title}</h3>
              <p className="text-sm text-muted">{info.message}</p>
            </div>
          ))}
        </div>
        <div className="p-5 border-t border-border">
          <button onClick={handleClose} className="w-full btn-primary">
            Mengerti
          </button>
        </div>
      </div>
    </div>
  )
}
