'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UserRole, TeamMemberSubRole } from '@/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Unauthorized')
  return { supabase, user }
}

export async function getTeamMembers() {
  const { supabase } = await requireAdmin()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  const adminClient = createAdminClient()
  const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 200 })

  return profiles.map(p => ({
    ...p,
    email: authData.users.find(u => u.id === p.id)?.email ?? null,
    last_sign_in_at: authData.users.find(u => u.id === p.id)?.last_sign_in_at ?? null,
    invited_at: authData.users.find(u => u.id === p.id)?.invited_at ?? null,
    confirmed_at: authData.users.find(u => u.id === p.id)?.confirmed_at ?? null,
  }))
}

export async function inviteTeamMember(data: {
  email: string
  full_name: string
  role: UserRole
  sub_role?: TeamMemberSubRole | null
}) {
  await requireAdmin()

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.inviteUserByEmail(data.email, {
    data: {
      full_name: data.full_name,
      role: data.role,
      sub_role: data.sub_role ?? null,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/team')
}

export async function updateTeamMemberRole(
  userId: string,
  role: UserRole,
  subRole?: TeamMemberSubRole | null
) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('profiles')
    .update({ role, sub_role: subRole ?? null })
    .eq('id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/team')
}

export async function removeTeamMember(userId: string) {
  const { user } = await requireAdmin()
  if (userId === user.id) throw new Error('You cannot remove yourself')

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) throw new Error(error.message)
  revalidatePath('/team')
}
