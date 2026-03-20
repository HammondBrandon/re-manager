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
import { Textarea } from '@/components/ui/textarea'
import { createContact, updateContact } from '@/lib/actions/contacts'
import { Contact } from '@/types'

const schema = z.object({
  type: z.enum(['client', 'lender', 'realtor', 'contractor']),
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  second_email: z.string().email('Invalid email').optional().or(z.literal('')),
  second_phone: z.string().optional(),
  company: z.string().optional(),
  client_rating: z.enum(['A+', 'A', 'B', 'C']).optional().nullable(),
  source: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  birthday: z.string().optional(),
  anniversary: z.string().optional(),
  spouse_first_name: z.string().optional(),
  spouse_last_name: z.string().optional(),
  spouse_email: z.string().email('Invalid email').optional().or(z.literal('')),
  spouse_phone: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  contact?: Contact
}

export function ContactForm({ open, onClose, contact }: Props) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!contact

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { type: 'client', client_rating: null },
    })

  // Reset form with contact data every time the dialog opens
  useEffect(() => {
    if (open) {
      reset(
        contact
          ? {
              type: contact.type,
              first_name: contact.first_name,
              last_name: contact.last_name,
              email: contact.email ?? '',
              phone: contact.phone ?? '',
              second_email: (contact as any).second_email ?? '',
              second_phone: (contact as any).second_phone ?? '',
              company: contact.company ?? '',
              client_rating: (contact as any).client_rating ?? null,
              source: (contact as any).source ?? '',
              address: (contact as any).address ?? '',
              city: (contact as any).city ?? '',
              state: (contact as any).state ?? '',
              zip: (contact as any).zip ?? '',
              birthday: (contact as any).birthday ?? '',
              anniversary: (contact as any).anniversary ?? '',
              spouse_first_name: (contact as any).spouse_first_name ?? '',
              spouse_last_name: (contact as any).spouse_last_name ?? '',
              spouse_email: (contact as any).spouse_email ?? '',
              spouse_phone: (contact as any).spouse_phone ?? '',
              notes: contact.notes ?? '',
            }
          : { type: 'client', client_rating: null }
      )
    }
  }, [open, contact, reset])

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      if (isEditing) {
        await updateContact(contact.id, values)
        toast.success('Contact updated')
      } else {
        await createContact(values)
        toast.success('Contact added')
      }
      reset()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const contactType = watch('type')

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Basic Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={watch('type')}
                  onValueChange={(v) => v && setValue('type', v as FormValues['type'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="lender">Lender</SelectItem>
                    <SelectItem value="realtor">Realtor</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {contactType === 'client' && (
                <div className="space-y-1.5">
                  <Label>Rating</Label>
                  <Select
                    value={watch('client_rating') ?? ''}
                    onValueChange={(v) => setValue('client_rating', (v || null) as FormValues['client_rating'])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input {...register('first_name')} />
                {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input {...register('last_name')} />
                {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input type="tel" {...register('phone')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Secondary Email</Label>
                <Input type="email" {...register('second_email')} />
              </div>
              <div className="space-y-1.5">
                <Label>Secondary Phone</Label>
                <Input type="tel" {...register('second_phone')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input {...register('company')} />
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Input {...register('source')} placeholder="Facebook, SOI, Referral…" />
              </div>
            </div>
          </div>

          {/* Key Dates */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Key Dates</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Birthday</Label>
                <Input type="date" {...register('birthday')} />
              </div>
              <div className="space-y-1.5">
                <Label>Anniversary</Label>
                <Input type="date" {...register('anniversary')} />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Address</h3>
            <div className="space-y-1.5">
              <Label>Street Address</Label>
              <Input {...register('address')} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5 col-span-1">
                <Label>City</Label>
                <Input {...register('city')} />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input {...register('state')} maxLength={2} placeholder="GA" />
              </div>
              <div className="space-y-1.5">
                <Label>Zip</Label>
                <Input {...register('zip')} />
              </div>
            </div>
          </div>

          {/* Spouse / Partner */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Spouse / Partner</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First Name</Label>
                <Input {...register('spouse_first_name')} />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name</Label>
                <Input {...register('spouse_last_name')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Spouse Email</Label>
                <Input type="email" {...register('spouse_email')} />
              </div>
              <div className="space-y-1.5">
                <Label>Spouse Phone</Label>
                <Input type="tel" {...register('spouse_phone')} />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={3} {...register('notes')} placeholder="Kids, pets, favorite restaurants, hobbies…" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
