'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

/**
 * Handles both Supabase auth flows:
 *  - PKCE  → ?code=xxx in query string  (server can read, but we handle client-side too)
 *  - Implicit → #access_token=xxx in hash (server CANNOT read — must be client-side)
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()

    async function handle() {
      // PKCE flow: exchange the code for a session
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          router.replace('/login?error=invalid_invite')
          return
        }
        router.replace('/update-password')
        return
      }

      // Implicit / hash flow: Supabase JS client auto-reads the hash and
      // fires onAuthStateChange. getSession() picks it up immediately.
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/update-password')
        return
      }

      // Wait up to 5 s for the hash to be processed
      let done = false
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (done) return
          done = true
          subscription.unsubscribe()
          if (session) {
            router.replace('/update-password')
          } else {
            router.replace('/login?error=invalid_invite')
          }
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  )
}
