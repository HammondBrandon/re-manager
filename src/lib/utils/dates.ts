import { addDays, format, parseISO } from 'date-fns'

export function calculateDueDiligenceEnd(
  underContractDate: string,
  dueDiligenceDays: number
): string {
  return format(addDays(parseISO(underContractDate), dueDiligenceDays), 'yyyy-MM-dd')
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return format(parseISO(date), 'MMM d, yyyy')
}

export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null
  const diff = parseISO(date).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function isOverdue(date: string | null | undefined): boolean {
  const days = daysUntil(date)
  return days !== null && days < 0
}

export function isDueSoon(date: string | null | undefined, withinDays = 3): boolean {
  const days = daysUntil(date)
  return days !== null && days >= 0 && days <= withinDays
}
