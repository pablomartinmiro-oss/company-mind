'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brain } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b]">
      <div className="w-full max-w-sm rounded-xl border border-white/[0.06] bg-[#111113] p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Brain className="h-5 w-5 text-zinc-300" />
          <span className="text-[15px] font-semibold tracking-tight text-zinc-100">
            Company Mind
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-[11px] font-medium text-zinc-400">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-zinc-100 outline-none transition focus:border-zinc-400 focus:ring-1 focus:ring-zinc-700 placeholder:text-zinc-500"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-[11px] font-medium text-zinc-400">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-zinc-100 outline-none transition focus:border-zinc-400 focus:ring-1 focus:ring-zinc-700 placeholder:text-zinc-500"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p className="text-[11px] text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white py-2.5 text-[13px] font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
