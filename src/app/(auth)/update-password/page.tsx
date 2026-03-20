'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Home, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Status = 'loading' | 'ready' | 'error'

function UpdatePasswordForm() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('loading')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let done = false

    async function bootstrap() {
      // Check if a session already exists (set by /auth/callback)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setStatus('ready')
        return
      }

      // Wait for auth state change (hash flow handled by /auth/callback)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (done) return
          done = true
          subscription.unsubscribe()
          setStatus(session ? 'ready' : 'error')
        }
      )

      const timeout = setTimeout(() => {
        if (done) return
        done = true
        subscription.unsubscribe()
        setStatus('error')
      }, 5000)

      return () => {
        clearTimeout(timeout)
        subscription.unsubscribe()
      }
    }

    bootstrap()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }

    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error(error.message)
      setSubmitting(false)
      return
    }

    toast.success('Password set! Welcome to RE Manager.')
    router.push('/dashboard')
  }

  return (
    <>
      {status === 'loading' && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-xl border bg-white p-6 shadow-sm text-center space-y-3">
          <p className="text-sm text-red-600 font-medium">
            This invite link is invalid or has expired.
          </p>
          <p className="text-xs text-gray-500">
            Ask your admin to send a new invitation.
          </p>
          <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>
            Back to Login
          </Button>
        </div>
      )}

      {status === 'ready' && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Setting password…' : 'Set Password & Sign In'}
            </Button>
          </form>
        </div>
      )}
    </>
  )
}

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1c2030]">
            <Home className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Set your password
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Choose a password to secure your account
            </p>
          </div>
        </div>
        <Suspense fallback={
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        }>
          <UpdatePasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
