'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createSocialPost, updateSocialPost, deleteSocialPost } from '@/lib/actions/social'
import {
  PLATFORMS, POST_STATUSES,
  type SocialPlatform, type SocialPostStatus, type SocialPost,
} from '@/lib/utils/social'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const schema = z.object({
  title: z.string().min(1, 'Required'),
  caption: z.string().optional(),
  status: z.string().min(1, 'Required'),
  scheduled_at: z.string().optional(),
  transaction_id: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  editPost?: SocialPost | null
  defaultDate?: string | null
  transactions: { id: string; property_address: string }[]
}

export function SocialPostForm({ open, onClose, editPost, defaultDate, transactions }: Props) {
  const [loading, setLoading] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([])
  const router = useRouter()
  const isEditing = !!editPost

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: editPost ? {
        title: editPost.title,
        caption: editPost.caption ?? '',
        status: editPost.status,
        scheduled_at: editPost.scheduled_at
          ? editPost.scheduled_at.slice(0, 16) // datetime-local format
          : '',
        transaction_id: editPost.transaction_id ?? '',
        notes: editPost.notes ?? '',
      } : {
        status: 'draft',
        scheduled_at: defaultDate ? `${defaultDate}T09:00` : '',
      },
    })

  useEffect(() => {
    if (editPost) {
      setSelectedPlatforms(editPost.platform ?? [])
    } else {
      setSelectedPlatforms([])
    }
  }, [editPost, open])

  function togglePlatform(p: SocialPlatform) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  async function onSubmit(values: FormValues) {
    if (selectedPlatforms.length === 0) {
      toast.error('Select at least one platform')
      return
    }
    setLoading(true)
    try {
      const payload = {
        title: values.title,
        caption: values.caption,
        platform: selectedPlatforms,
        status: values.status as SocialPostStatus,
        scheduled_at: values.scheduled_at || undefined,
        transaction_id: values.transaction_id || undefined,
        notes: values.notes,
      }
      if (isEditing) {
        await updateSocialPost(editPost.id, payload)
        toast.success('Post updated')
      } else {
        await createSocialPost(payload)
        toast.success('Post created')
      }
      reset()
      onClose()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!editPost || !confirm('Delete this post?')) return
    setLoading(true)
    try {
      await deleteSocialPost(editPost.id)
      toast.success('Post deleted')
      reset()
      onClose()
      router.refresh()
    } catch {
      toast.error('Failed to delete post')
    } finally {
      setLoading(false)
    }
  }

  const statusColors: Record<SocialPostStatus, string> = {
    draft: 'text-gray-500',
    scheduled: 'text-blue-600',
    published: 'text-green-600',
    cancelled: 'text-red-500',
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Post' : 'New Social Post'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input placeholder="Post title…" {...register('title')} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Caption / Copy</Label>
            <Textarea rows={3} placeholder="Write your post caption…" {...register('caption')} />
          </div>

          {/* Platform multi-select */}
          <div className="space-y-1.5">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => togglePlatform(p.value)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    selectedPlatforms.includes(p.value)
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                defaultValue={watch('status')}
                onValueChange={(v) => v && setValue('status', v as string)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POST_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <span className={statusColors[s.value]}>{s.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Scheduled Date/Time</Label>
              <Input type="datetime-local" {...register('scheduled_at')} />
            </div>
          </div>

          {transactions.length > 0 && (
            <div className="space-y-1.5">
              <Label>Link to Transaction <span className="text-gray-400">(optional)</span></Label>
              <Select
                defaultValue={watch('transaction_id')}
                onValueChange={(v) => setValue('transaction_id', v as string ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {transactions.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.property_address}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Notes <span className="text-gray-400">(optional)</span></Label>
            <Textarea rows={2} placeholder="Internal notes…" {...register('notes')} />
          </div>

          <div className="flex items-center justify-between pt-1">
            {isEditing ? (
              <Button type="button" variant="outline" onClick={handleDelete} disabled={loading}
                className="text-red-600 hover:text-red-700">
                Delete
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Post'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
