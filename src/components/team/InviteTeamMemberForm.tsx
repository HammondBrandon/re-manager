'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { inviteTeamMember, updateTeamMemberRole } from '@/lib/actions/team'
import { UserRole, TeamMemberSubRole } from '@/types'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  team_member: 'Team Member',
  read_only: 'Read Only',
}

const SUB_ROLE_LABELS: Record<TeamMemberSubRole, string> = {
  personal_assistant: 'Personal Assistant',
  transaction_manager: 'Transaction Manager',
  social_media_manager: 'Social Media Manager',
  video_editor: 'Video Editor',
}

const inviteSchema = z.object({
  full_name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'team_member', 'read_only']),
  sub_role: z.enum(['personal_assistant', 'transaction_manager', 'social_media_manager', 'video_editor']).nullable().optional(),
})

const editSchema = z.object({
  role: z.enum(['admin', 'team_member', 'read_only']),
  sub_role: z.enum(['personal_assistant', 'transaction_manager', 'social_media_manager', 'video_editor']).nullable().optional(),
})

type InviteValues = z.infer<typeof inviteSchema>
type EditValues = z.infer<typeof editSchema>

interface Member {
  id: string
  full_name: string
  role: UserRole
  sub_role: TeamMemberSubRole | null
  email: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  member?: Member
}

export function InviteTeamMemberForm({ open, onClose, member }: Props) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!member

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<InviteValues>({
      resolver: zodResolver(isEditing ? editSchema : inviteSchema) as any,
      defaultValues: { role: 'team_member', sub_role: null },
    })

  useEffect(() => {
    if (open) {
      reset(
        member
          ? { role: member.role, sub_role: member.sub_role ?? null }
          : { role: 'team_member', sub_role: null }
      )
    }
  }, [open, member, reset])

  const role = watch('role')

  async function onSubmit(values: InviteValues) {
    setLoading(true)
    try {
      if (isEditing) {
        await updateTeamMemberRole(member!.id, values.role, values.sub_role ?? null)
        toast.success('Role updated')
      } else {
        await inviteTeamMember({
          email: values.email,
          full_name: values.full_name,
          role: values.role,
          sub_role: values.sub_role ?? null,
        })
        toast.success('Invite sent! They will receive an email to set up their account.')
      }
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Edit Role — ${member!.full_name}` : 'Invite Team Member'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {!isEditing && (
            <>
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input {...register('full_name')} placeholder="Jane Smith" />
                {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" {...register('email')} placeholder="jane@example.com" />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={watch('role')}
              onValueChange={(v) => v && setValue('role', v as UserRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {role === 'team_member' && (
            <div className="space-y-1.5">
              <Label>Sub-Role</Label>
              <Select
                value={watch('sub_role') ?? ''}
                onValueChange={(v) => setValue('sub_role', (v || null) as TeamMemberSubRole | null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(SUB_ROLE_LABELS) as [TeamMemberSubRole, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!isEditing && (
            <p className="text-xs text-muted-foreground">
              They will receive an email invite to set up their password and access the app.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : isEditing ? 'Save Changes' : 'Send Invite'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
