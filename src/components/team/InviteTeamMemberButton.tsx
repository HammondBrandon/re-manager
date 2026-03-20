'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InviteTeamMemberForm } from './InviteTeamMemberForm'

export function InviteTeamMemberButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <UserPlus className="h-4 w-4" />
        Invite Team Member
      </Button>
      <InviteTeamMemberForm open={open} onClose={() => setOpen(false)} />
    </>
  )
}
