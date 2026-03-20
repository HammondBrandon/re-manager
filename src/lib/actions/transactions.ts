'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calculateDueDiligenceEnd } from '@/lib/utils/dates'
import { getAutoTasks } from '@/lib/utils/auto-tasks'
import { BuyerStage, SellerStage, UnderContractSubPhase } from '@/types'

export async function getTransactions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      transaction_manager:profiles!transaction_manager_id(id, full_name),
      buyer_details(*),
      seller_details(*),
      transaction_contacts(
        id, role,
        contact:contacts(*)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getTransaction(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      transaction_manager:profiles!transaction_manager_id(id, full_name),
      buyer_details(*),
      seller_details(*),
      transaction_contacts(
        id, role,
        contact:contacts(*)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createTransaction(formData: {
  type: 'buyer' | 'seller'
  property_address: string
  stage: string
  transaction_manager_id?: string
  under_contract_date?: string
  closing_date?: string
  due_diligence_days?: number
  notes?: string
  // Buyer details
  buyer_details?: {
    desired_locations?: string[]
    min_bedrooms?: number
    max_bedrooms?: number
    min_bathrooms?: number
    max_bathrooms?: number
    min_sqft?: number
    max_sqft?: number
    max_price?: number
  }
  // Seller details
  seller_details?: {
    listing_price?: number
    mls_number?: string
  }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const dueDiligenceDays = formData.due_diligence_days ?? 10
  const dueDiligenceEndDate =
    formData.under_contract_date
      ? calculateDueDiligenceEnd(formData.under_contract_date, dueDiligenceDays)
      : null

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      type: formData.type,
      property_address: formData.property_address,
      stage: formData.stage,
      transaction_manager_id: formData.transaction_manager_id ?? null,
      under_contract_date: formData.under_contract_date ?? null,
      closing_date: formData.closing_date ?? null,
      due_diligence_days: dueDiligenceDays,
      due_diligence_end_date: dueDiligenceEndDate,
      notes: formData.notes ?? null,
      created_by: user?.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Insert type-specific details
  if (formData.type === 'buyer' && formData.buyer_details) {
    await supabase.from('buyer_details').insert({
      transaction_id: transaction.id,
      ...formData.buyer_details,
    })
  }

  if (formData.type === 'seller' && formData.seller_details) {
    await supabase.from('seller_details').insert({
      transaction_id: transaction.id,
      ...formData.seller_details,
    })
  }

  revalidatePath('/transactions')
  return transaction
}

export async function updateTransactionStage(
  id: string,
  stage: BuyerStage | SellerStage,
  subPhase?: UnderContractSubPhase | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch transaction to get type and transaction manager
  const { data: transaction } = await supabase
    .from('transactions')
    .select('type, transaction_manager_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('transactions')
    .update({
      stage,
      under_contract_sub_phase: subPhase ?? null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  // Auto-create tasks for this stage/sub-phase
  if (transaction) {
    const templates = getAutoTasks(transaction.type, stage, subPhase)
    const assignTo = transaction.transaction_manager_id ?? user?.id

    if (templates.length > 0 && assignTo) {
      const taskInserts = templates.map((t) => ({
        title: t.title,
        description: t.description ?? null,
        assigned_to: assignTo,
        assigned_by: user?.id,
        transaction_id: id,
        status: 'pending' as const,
        is_auto_assigned: true,
      }))

      await supabase.from('tasks').insert(taskInserts)

      // Notify transaction manager if different from current user
      if (assignTo !== user?.id) {
        await supabase.from('notifications').insert({
          user_id: assignTo,
          type: 'task_assigned',
          title: `${templates.length} new task${templates.length > 1 ? 's' : ''} assigned`,
          body: `Transaction stage updated — new tasks ready for your action.`,
          link: `/tasks`,
        })
      }
    }
  }

  revalidatePath('/transactions')
  revalidatePath(`/transactions/${id}`)
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
}

export async function updateTransaction(
  id: string,
  formData: {
    property_address?: string
    transaction_manager_id?: string | null
    under_contract_date?: string | null
    closing_date?: string | null
    due_diligence_days?: number
    notes?: string | null
    stage?: string
    under_contract_sub_phase?: UnderContractSubPhase | null
  }
) {
  const supabase = await createClient()

  const updates: Record<string, unknown> = { ...formData }

  if (formData.under_contract_date && formData.due_diligence_days) {
    updates.due_diligence_end_date = calculateDueDiligenceEnd(
      formData.under_contract_date,
      formData.due_diligence_days
    )
  }

  const { error } = await supabase.from('transactions').update(updates).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/transactions')
  revalidatePath(`/transactions/${id}`)
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/transactions')
}

export async function addTransactionContact(
  transactionId: string,
  contactId: string,
  role: string
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('transaction_contacts')
    .insert({ transaction_id: transactionId, contact_id: contactId, role })
  if (error) throw new Error(error.message)
  revalidatePath(`/transactions/${transactionId}`)
}

export async function removeTransactionContact(
  transactionContactId: string,
  transactionId: string
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('transaction_contacts')
    .delete()
    .eq('id', transactionContactId)
  if (error) throw new Error(error.message)
  revalidatePath(`/transactions/${transactionId}`)
}

export async function getTeamMembers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, sub_role')
    .in('role', ['admin', 'team_member'])
    .order('full_name')

  if (error) throw new Error(error.message)
  return data
}
