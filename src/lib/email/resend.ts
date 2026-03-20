import { Resend } from 'resend'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@yourdomain.com'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendEmail({
  to,
  toName,
  subject,
  html,
}: {
  to: string
  toName?: string
  subject: string
  html: string
}) {
  const resend = getResend()
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toName ? `${toName} <${to}>` : to,
    subject,
    html,
  })
  if (error) throw new Error(error.message)
}
