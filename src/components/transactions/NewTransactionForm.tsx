'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createTransaction } from '@/lib/actions/transactions'
import { BUYER_STAGES, SELLER_STAGES } from '@/lib/utils/transactions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

const schema = z.object({
  type: z.enum(['buyer', 'seller']),
  property_address: z.string().min(1, 'Required'),
  stage: z.string().min(1, 'Required'),
  transaction_manager_id: z.string().optional(),
  under_contract_date: z.string().optional(),
  closing_date: z.string().optional(),
  due_diligence_days: z.coerce.number().min(1).max(365).optional(),
  notes: z.string().optional(),
  // Buyer
  max_price: z.coerce.number().optional(),
  desired_locations: z.string().optional(),
  min_bedrooms: z.coerce.number().optional(),
  max_bedrooms: z.coerce.number().optional(),
  min_bathrooms: z.coerce.number().optional(),
  max_sqft: z.coerce.number().optional(),
  // Seller
  listing_price: z.coerce.number().optional(),
  mls_number: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  teamMembers: { id: string; full_name: string }[]
}

export function NewTransactionForm({ teamMembers }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { type: 'buyer', stage: 'pre_approval', due_diligence_days: 10 },
    })

  const type = watch('type')
  const stage = watch('stage')
  const stages = type === 'buyer' ? BUYER_STAGES : SELLER_STAGES

  // Reset stage when type changes
  function handleTypeChange(value: 'buyer' | 'seller' | null) {
    if (!value) return
    setValue('type', value)
    setValue('stage', value === 'buyer' ? 'pre_approval' : 'listing_agreement_signed')
  }

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const transaction = await createTransaction({
        type: values.type,
        property_address: values.property_address,
        stage: values.stage,
        transaction_manager_id: values.transaction_manager_id || undefined,
        under_contract_date: values.under_contract_date || undefined,
        closing_date: values.closing_date || undefined,
        due_diligence_days: values.due_diligence_days,
        notes: values.notes || undefined,
        buyer_details: values.type === 'buyer' ? {
          max_price: values.max_price,
          desired_locations: values.desired_locations
            ? values.desired_locations.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          min_bedrooms: values.min_bedrooms,
          max_bedrooms: values.max_bedrooms,
          min_bathrooms: values.min_bathrooms,
          max_sqft: values.max_sqft,
        } : undefined,
        seller_details: values.type === 'seller' ? {
          listing_price: values.listing_price,
          mls_number: values.mls_number,
        } : undefined,
      })
      toast.success('Transaction created')
      router.push(`/transactions/${transaction.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white rounded-lg border p-6">
      {/* Type */}
      <div className="space-y-1.5">
        <Label>Transaction Type</Label>
        <Select value={type} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="buyer">Buyer</SelectItem>
            <SelectItem value="seller">Seller</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Address */}
      <div className="space-y-1.5">
        <Label>Property Address</Label>
        <Input placeholder="123 Main St, City, State" {...register('property_address')} />
        {errors.property_address && (
          <p className="text-xs text-red-500">{errors.property_address.message}</p>
        )}
      </div>

      {/* Stage */}
      <div className="space-y-1.5">
        <Label>Current Stage</Label>
        <Select value={stage} onValueChange={(v) => v && setValue('stage', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {stages.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transaction Manager */}
      <div className="space-y-1.5">
        <Label>Transaction Manager</Label>
        <Select onValueChange={(v) => v && setValue('transaction_manager_id', v as string)}>
          <SelectTrigger>
            <SelectValue placeholder="Assign a transaction manager" />
          </SelectTrigger>
          <SelectContent>
            {teamMembers.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Under Contract Date</Label>
          <Input type="date" {...register('under_contract_date')} />
        </div>
        <div className="space-y-1.5">
          <Label>Closing Date</Label>
          <Input type="date" {...register('closing_date')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Due Diligence Days <span className="text-gray-400">(default: 10)</span></Label>
        <Input type="number" min={1} max={365} {...register('due_diligence_days')} />
      </div>

      <Separator />

      {/* Type-specific fields */}
      {type === 'buyer' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Buyer Preferences</h3>
          <div className="space-y-1.5">
            <Label>Desired Locations <span className="text-gray-400">(comma-separated)</span></Label>
            <Input placeholder="Downtown, Suburbs, East Side" {...register('desired_locations')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Min Beds</Label>
              <Input type="number" min={0} {...register('min_bedrooms')} />
            </div>
            <div className="space-y-1.5">
              <Label>Max Beds</Label>
              <Input type="number" min={0} {...register('max_bedrooms')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Min Baths</Label>
              <Input type="number" min={0} step={0.5} {...register('min_bathrooms')} />
            </div>
            <div className="space-y-1.5">
              <Label>Max Sqft</Label>
              <Input type="number" min={0} {...register('max_sqft')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Max Price</Label>
            <Input type="number" min={0} placeholder="500000" {...register('max_price')} />
          </div>
        </div>
      )}

      {type === 'seller' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Listing Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Listing Price</Label>
              <Input type="number" min={0} placeholder="500000" {...register('listing_price')} />
            </div>
            <div className="space-y-1.5">
              <Label>MLS Number</Label>
              <Input placeholder="MLS#" {...register('mls_number')} />
            </div>
          </div>
        </div>
      )}

      <Separator />

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea rows={3} {...register('notes')} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create Transaction'}
        </Button>
      </div>
    </form>
  )
}
