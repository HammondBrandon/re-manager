'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()

    async function handle() {
      // ── PKCE flow: ?code=xxx ──────────────────────────────────────────
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        router.replace(error ? '/login?error=invalid_invite' : '/update-password')
        return
      }

      // ── Implicit / hash flow: #access_token=xxx ───────────────────────
      // createBrowserClient does NOT auto-process hash tokens, so we do it
      // manually by parsing window.location.hash and calling setSession().
      const hash = window.location.hash.substring(1) // strip leading #
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        router.replace(error ? '/login?error=invalid_invite' : '/update-password')
        return
      }

      // Nothing we can use — bad or missing token
      router.replace('/login?error=invalid_invite')
    }

    handle()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center gap-3 text-gray-500">
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm">Verifying your invite…</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-gray-400" />}>
        <CallbackHandler />
      </Suspense>
    </div>
  )
}
