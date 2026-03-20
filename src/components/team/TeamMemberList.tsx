'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { UserCog, Trash2, Mail, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { removeTeamMember } from '@/lib/actions/team'
import { InviteTeamMemberForm } from './InviteTeamMemberForm'
import { UserRole, TeamMemberSubRole } from '@/types'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  team_member: 'Team Member',
  read_only: 'Read Only',
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-amber-500/10 text-amber-600 border-amber-200',
  team_member: 'bg-blue-500/10 text-blue-600 border-blue-200',
  read_only: 'bg-gray-100 text-gray-600 border-gray-200',
}

const SUB_ROLE_LABELS: Record<TeamMemberSubRole, string> = {
  personal_assistant: 'Personal Assistant',
  transaction_manager: 'Transaction Manager',
  social_media_manager: 'Social Media Manager',
  video_editor: 'Video Editor',
}

interface Member {
  id: string
  full_name: string
  role: UserRole
  sub_role: TeamMemberSubRole | null
  email: string | null
  last_sign_in_at: string | null
  invited_at: string | null
  confirmed_at: string | null
}

interface Props {
  members: Member[]
  currentUserId: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function TeamMemberList({ members, currentUserId }: Props) {
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  async function handleRemove(member: Member) {
    if (!confirm(`Remove ${member.full_name} from the team? This cannot be undone.`)) return
    setRemoving(member.id)
    try {
      await removeTeamMember(member.id)
      toast.success(`${member.full_name} has been removed`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <>
      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">Member</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Last Active</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((member) => {
              const isPending = !member.confirmed_at
              const isCurrentUser = member.id === currentUserId

              return (
                <tr key={member.id} className="hover:bg-gray-50/50">
                  {/* Member info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1c2030] text-xs font-semibold text-white">
                        {getInitials(member.full_name || member.email || '?')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.full_name || '—'}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs font-normal text-gray-400">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant="outline"
                        className={`w-fit text-xs font-medium ${ROLE_COLORS[member.role]}`}
                      >
                        {ROLE_LABELS[member.role]}
                      </Badge>
                      {member.sub_role && (
                        <span className="text-xs text-gray-500">
                          {SUB_ROLE_LABELS[member.sub_role]}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {isPending ? (
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Invite Pending</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-green-600">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-xs font-medium">Active</span>
                      </div>
                    )}
                  </td>

                  {/* Last active */}
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {member.last_sign_in_at
                      ? new Date(member.last_sign_in_at).toLocaleDateString()
                      : isPending
                      ? 'Never signed in'
                      : '—'}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setEditingMember(member)}
                        title="Edit role"
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                      {!isCurrentUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleRemove(member)}
                          disabled={removing === member.id}
                          title="Remove member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {members.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-500">
            No team members yet. Invite someone to get started.
          </div>
        )}
      </div>

      <InviteTeamMemberForm
        open={!!editingMember}
        onClose={() => setEditingMember(null)}
        member={editingMember ?? undefined}
      />
    </>
  )
}
