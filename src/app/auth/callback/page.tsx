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
    let done = false

    async function handle() {
      // PKCE flow: ?code=xxx
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        router.replace(error ? '/login?error=invalid_invite' : '/update-password')
        return
      }

      // Implicit / hash flow: Supabase JS client auto-reads window.location.hash
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/update-password')
        return
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (done) return
          done = true
          subscription.unsubscribe()
          router.replace(session ? '/update-password' : '/login?error=invalid_invite')
        }
      )

      setTimeout(() => {
        if (done) return
        done = true
        subscription.unsubscribe()
        router.replace('/login?error=invalid_invite')
      }, 5000)
    }

    handle()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
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
