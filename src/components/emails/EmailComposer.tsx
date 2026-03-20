'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { sendTransactionEmail } from '@/lib/actions/emails'
import { EMAIL_TEMPLATES, fillTemplate } from '@/lib/email/templates'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Mail } from 'lucide-react'

const schema = z.object({
  toEmail: z.string().min(1, 'Required').email('Invalid email'),
  toName: z.string().optional(),
  subject: z.string().min(1, 'Required'),
  body: z.string().min(1, 'Required'),
})

type FormValues = z.infer<typeof schema>

interface Contact {
  email: string | null
  first_name: string
  last_name: string
}

interface Props {
  transactionId: string
  agentName: string
  contacts?: Contact[]
}

export function EmailComposer({ transactionId, agentName, contacts = [] }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<FormValues>({ resolver: zodResolver(schema) })

  function applyTemplate(templateId: string) {
    const tpl = EMAIL_TEMPLATES.find((t) => t.id === templateId)
    if (!tpl) return
    const toName = watch('toName') || 'there'
    setValue('subject', tpl.subject)
    setValue('body', fillTemplate(tpl.body, toName, agentName))
  }

  function handleContactSelect(value: string) {
    const contact = contacts.find(
      (c) => `${c.first_name} ${c.last_name}` === value
    )
    if (!contact) return
    setValue('toName', `${contact.first_name} ${contact.last_name}`)
    if (contact.email) setValue('toEmail', contact.email)
  }

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await sendTransactionEmail({
          transactionId,
          toEmail: values.toEmail,
          toName: values.toName,
          subject: values.subject,
          body: values.body,
        })
        toast.success('Email sent')
        reset()
        setOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to send email')
      }
    })
  }

  const emailContacts = contacts.filter((c) => c.email)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Mail className="mr-1.5 h-4 w-4" /> Compose Email
      </Button>

      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {/* Template picker */}
            <div className="space-y-1.5">
              <Label>Template <span className="text-gray-400">(optional)</span></Label>
              <Select onValueChange={(v) => v && applyTemplate(v as string)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template…" />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick-fill from contacts */}
            {emailContacts.length > 0 && (
              <div className="space-y-1.5">
                <Label>Fill From Contact <span className="text-gray-400">(optional)</span></Label>
                <Select onValueChange={(v) => v && handleContactSelect(v as string)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select contact…" />
                  </SelectTrigger>
                  <SelectContent>
                    {emailContacts.map((c) => (
                      <SelectItem
                        key={`${c.first_name}-${c.last_name}`}
                        value={`${c.first_name} ${c.last_name}`}
                      >
                        {c.first_name} {c.last_name} — {c.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>To Name</Label>
                <Input placeholder="John Smith" {...register('toName')} />
              </div>
              <div className="space-y-1.5">
                <Label>To Email</Label>
                <Input type="email" placeholder="john@example.com" {...register('toEmail')} />
                {errors.toEmail && <p className="text-xs text-red-500">{errors.toEmail.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input placeholder="Email subject…" {...register('subject')} />
              {errors.subject && <p className="text-xs text-red-500">{errors.subject.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Body</Label>
              <Textarea rows={8} placeholder="Email body…" {...register('body')} />
              {errors.body && <p className="text-xs text-red-500">{errors.body.message}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Sending…' : 'Send Email'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
