'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ImportContactRow = {
  type?: string
  client_rating?: string
  source?: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  second_email?: string
  second_phone?: string
  birthday?: string
  anniversary?: string
  spouse_first_name?: string
  spouse_last_name?: string
  spouse_email?: string
  spouse_phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  notes?: string
}

export type ImportTransactionRow = {
  type: string
  property_address: string
  stage?: string
  purchase_price?: string
  closing_date?: string
  under_contract_date?: string
  due_diligence_days?: string
  mls_number?: string
  listing_price?: string
  notes?: string
}

const VALID_CONTACT_TYPES = ['client', 'lender', 'realtor', 'contractor']
const VALID_RATINGS = ['A+', 'A', 'B', 'C']

export async function importContacts(rows: ImportContactRow[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let succeeded = 0
  let failed = 0
  const errors: string[] = []

  for (const row of rows) {
    const { error } = await supabase.from('contacts').insert({
      type: VALID_CONTACT_TYPES.includes(row.type ?? '') ? row.type : 'client',
      client_rating: VALID_RATINGS.includes(row.client_rating ?? '') ? row.client_rating : null,
      source: row.source || null,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email || null,
      phone: row.phone || null,
      second_email: row.second_email || null,
      second_phone: row.second_phone || null,
      birthday: row.birthday || null,
      anniversary: row.anniversary || null,
      spouse_first_name: row.spouse_first_name || null,
      spouse_last_name: row.spouse_last_name || null,
      spouse_email: row.spouse_email || null,
      spouse_phone: row.spouse_phone || null,
      address: row.address || null,
      city: row.city || null,
      state: row.state || null,
      zip: row.zip || null,
      notes: row.notes || null,
      created_by: user?.id,
    })

    if (error) {
      failed++
      errors.push(`${row.first_name} ${row.last_name}: ${error.message}`)
    } else {
      succeeded++
    }
  }

  revalidatePath('/crm')
  return { succeeded, failed, errors }
}

const VALID_BUYER_STAGES = ['pre_approval', 'buyers_agreement', 'home_search', 'under_contract', 'closed']
const VALID_SELLER_STAGES = ['listing_agreement_signed', 'listing_photos_video', 'live_on_market', 'under_contract', 'closed']

export async function importTransactions(rows: ImportTransactionRow[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let succeeded = 0
  let failed = 0
  const errors: string[] = []

  for (const row of rows) {
    const type = row.type === 'seller' ? 'seller' : 'buyer'
    const validStages = type === 'buyer' ? VALID_BUYER_STAGES : VALID_SELLER_STAGES
    const stage = validStages.includes(row.stage ?? '') ? row.stage : (type === 'buyer' ? 'home_search' : 'live_on_market')
    const dueDiligenceDays = parseInt(row.due_diligence_days ?? '10') || 10

    const { data: txn, error: txnError } = await supabase
      .from('transactions')
      .insert({
        type,
        property_address: row.property_address,
        stage,
        under_contract_date: row.under_contract_date || null,
        closing_date: row.closing_date || null,
        due_diligence_days: dueDiligenceDays,
        notes: row.notes || null,
        created_by: user?.id,
      })
      .select('id')
      .single()

    if (txnError) {
      failed++
      errors.push(`${row.property_address}: ${txnError.message}`)
      continue
    }

    // Insert buyer/seller details
    if (type === 'buyer') {
      await supabase.from('buyer_details').insert({
        transaction_id: txn.id,
        max_price: row.purchase_price ? parseFloat(row.purchase_price) : null,
      })
    } else {
      await supabase.from('seller_details').insert({
        transaction_id: txn.id,
        listing_price: row.purchase_price ? parseFloat(row.purchase_price) : null,
        mls_number: row.mls_number || null,
      })
    }

    succeeded++
  }

  revalidatePath('/transactions')
  return { succeeded, failed, errors }
}
