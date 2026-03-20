'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createTask, updateTask } from '@/lib/actions/tasks'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  assigned_to: z.string().min(1, 'Required'),
  due_date: z.string().optional(),
  follow_up_date: z.string().optional(),
  review_requested_from: z.string().optional(),
  transaction_id: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Profile { id: string; full_name: string }
interface Transaction { id: string; property_address: string }

interface Props {
  open: boolean
  onClose: () => void
  teamMembers: Profile[]
  transactions?: Transaction[]
  editTask?: {
    id: string
    title: string
    description: string | null
    assigned_to: string
    due_date: string | null
    follow_up_date: string | null
    review_requested_from: string | null
    transaction_id: string | null
  }
}

export function TaskForm({ open, onClose, teamMembers, transactions = [], editTask }: Props) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!editTask

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: editTask ? {
        title: editTask.title,
        description: editTask.description ?? '',
        assigned_to: editTask.assigned_to,
        due_date: editTask.due_date ?? '',
        follow_up_date: editTask.follow_up_date ?? '',
        review_requested_from: editTask.review_requested_from ?? '',
        transaction_id: editTask.transaction_id ?? '',
      } : {},
    })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      if (isEditing) {
        await updateTask(editTask.id, {
          title: values.title,
          description: values.description,
          assigned_to: values.assigned_to,
          due_date: values.due_date || null,
          follow_up_date: values.follow_up_date || null,
          review_requested_from: values.review_requested_from || null,
        })
        toast.success('Task updated')
      } else {
        await createTask({
          title: values.title,
          description: values.description,
          assigned_to: values.assigned_to,
          due_date: values.due_date || undefined,
          follow_up_date: values.follow_up_date || undefined,
          review_requested_from: values.review_requested_from || undefined,
          transaction_id: values.transaction_id || undefined,
        })
        toast.success('Task created')
      }
      reset()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input placeholder="Task title..." {...register('title')} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={2} placeholder="Optional details..." {...register('description')} />
          </div>

          <div className="space-y-1.5">
            <Label>Assign To</Label>
            <Select
              defaultValue={watch('assigned_to')}
              onValueChange={(v) => v && setValue('assigned_to', v as string)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assigned_to && <p className="text-xs text-red-500">{errors.assigned_to.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" {...register('due_date')} />
            </div>
            <div className="space-y-1.5">
              <Label>Follow-up Date</Label>
              <Input type="date" {...register('follow_up_date')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Request Review From <span className="text-gray-400">(optional)</span></Label>
            <Select
              defaultValue={watch('review_requested_from')}
              onValueChange={(v) => setValue('review_requested_from', v as string ?? '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isEditing && transactions.length > 0 && (
            <div className="space-y-1.5">
              <Label>Link to Transaction <span className="text-gray-400">(optional)</span></Label>
              <Select onValueChange={(v) => setValue('transaction_id', v as string ?? '')}>
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

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
