export const dynamic = 'force-dynamic'

import { UserPlus } from 'lucide-react'
import { getTeamMembers } from '@/lib/actions/team'
import { createClient } from '@/lib/supabase/server'
import { TeamMemberList } from '@/components/team/TeamMemberList'
import { InviteTeamMemberButton } from '@/components/team/InviteTeamMemberButton'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const members = await getTeamMembers()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your team members, roles, and access.
          </p>
        </div>
        <InviteTeamMemberButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Total Members</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{members.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {members.filter(m => m.confirmed_at).length}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Pending Invite</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {members.filter(m => !m.confirmed_at).length}
          </p>
        </div>
      </div>

      {/* Team list */}
      <TeamMemberList
        members={members as any}
        currentUserId={user?.id ?? ''}
      />
    </div>
  )
}
