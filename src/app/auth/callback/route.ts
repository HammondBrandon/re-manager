import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // After invite code exchange, send them to set their password
      return NextResponse.redirect(new URL('/update-password', origin))
    }
  }

  // Something went wrong — send back to login with a message
  return NextResponse.redirect(new URL('/login?error=invalid_invite', origin))
}
