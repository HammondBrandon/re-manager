'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ClientRating, ContactType } from '@/types'

type ContactPayload = {
  type: ContactType
  first_name: string
  last_name: string
  email?: string
  phone?: string
  second_email?: string
  second_phone?: string
  company?: string
  client_rating?: ClientRating | null
  source?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  birthday?: string
  anniversary?: string
  spouse_first_name?: string
  spouse_last_name?: string
  spouse_email?: string
  spouse_phone?: string
  notes?: string
}

export async function getContacts(type?: ContactType) {
  const supabase = await createClient()
  let query = supabase
    .from('contacts')
    .select('*')
    .order('last_name', { ascending: true })

  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function createContact(formData: ContactPayload) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('contacts').insert({
    ...formData,
    created_by: user?.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/crm')
}

export async function updateContact(id: string, formData: ContactPayload) {
  const supabase = await createClient()
  const { error } = await supabase.from('contacts').update(formData).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/crm')
}

export async function deleteContact(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/crm')
}
