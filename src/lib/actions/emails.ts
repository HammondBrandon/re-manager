'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendEmail as sendViaResend } from '@/lib/email/resend'
import { textToHtml } from '@/lib/email/templates'

export async function getEmailLogs(transactionId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('email_logs')
    .select('*, sender:sent_by(full_name)')
    .eq('transaction_id', transactionId)
    .order('sent_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data as Array<{
    id: string
    to_email: string
    to_name: string | null
    subject: string
    body: string
    template_used: string | null
    sent_at: string
    sender: { full_name: string } | null
  }>
}

export async function sendTransactionEmail({
  transactionId,
  toEmail,
  toName,
  subject,
  body,
  templateUsed,
}: {
  transactionId: string
  toEmail: string
  toName?: string
  subject: string
  body: string
  templateUsed?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await sendViaResend({
    to: toEmail,
    toName,
    subject,
    html: textToHtml(body),
  })

  const { error } = await supabase.from('email_logs').insert({
    transaction_id: transactionId,
    to_email: toEmail,
    to_name: toName || null,
    subject,
    body,
    template_used: templateUsed || null,
    sent_by: user.id,
  })
  if (error) throw new Error(error.message)

  revalidatePath(`/transactions/${transactionId}`)
}
