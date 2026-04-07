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
    <div className="flex min-h-screen items-center justify-center">
      <div className="relative glass-card w-full max-w-sm rounded-3xl p-8">
        <div className="glass-card-inner rounded-3xl" />
        <div className="relative">
          <div className="mb-6 flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff7a4d] to-[#ff5a2d] shadow-[0_4px_12px_rgba(255,106,61,0.3),inset_0_1px_0_rgba(255,255,255,0.3)]">
              <Brain className="h-[18px] w-[18px] text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-[#1a1a1a]">
              Company Mind
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-[11px] font-medium text-zinc-500">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-white/60 bg-white/50 px-3 py-2 text-[13px] text-[#1a1a1a] outline-none transition focus:border-[#ff6a3d] focus:ring-1 focus:ring-[rgba(255,106,61,0.2)] placeholder:text-zinc-400"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-[11px] font-medium text-zinc-500">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-white/60 bg-white/50 px-3 py-2 text-[13px] text-[#1a1a1a] outline-none transition focus:border-[#ff6a3d] focus:ring-1 focus:ring-[rgba(255,106,61,0.2)] placeholder:text-zinc-400"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <p className="text-[11px] text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-br from-[#ff7a4d] to-[#ff5a2d] py-2.5 text-[13px] font-medium text-white shadow-[0_4px_12px_rgba(255,106,61,0.25),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all hover:shadow-[0_6px_16px_rgba(255,106,61,0.35)] disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
