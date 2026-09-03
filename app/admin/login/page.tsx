'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ShoppingBag } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const { error: authError } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    })
    if (authError) {
      setError(authError.message)
      return
    }
    router.push('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <form onSubmit={handleLogin} className="bg-surface p-8 rounded-2xl border border-border shadow-card w-full max-w-sm space-y-4">
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="bg-primary p-2.5 rounded-xl">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Login Admin</h1>
        </div>
        {error && <p className="text-danger text-sm bg-danger/10 rounded-lg px-3 py-2">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          required
        />
        <button type="submit" className="btn-primary w-full">
          Login
        </button>
      </form>
    </div>
  )
}
