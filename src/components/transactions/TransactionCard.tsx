'use client'

import Link from 'next/link'
import { formatDate, daysUntil, isOverdue, isDueSoon } from '@/lib/utils/dates'
import { getStageLabel, getSubPhaseLabel } from '@/lib/utils/transactions'
import { MapPin, Calendar, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransactionCardProps {
  transaction: {
    id: string
    type: 'buyer' | 'seller'
    stage: string
    under_contract_sub_phase: string | null
    property_address: string
    closing_date: string | null
    due_diligence_end_date: string | null
    transaction_manager: { full_name: string } | null
  }
}

export function TransactionCard({ transaction: t }: TransactionCardProps) {
  const closingDays = daysUntil(t.closing_date)
  const ddDays = daysUntil(t.due_diligence_end_date)
  const closingOverdue = isOverdue(t.closing_date)
  const ddOverdue = isOverdue(t.due_diligence_end_date)
  const closingSoon = isDueSoon(t.closing_date, 7)
  const ddSoon = isDueSoon(t.due_diligence_end_date, 3)

  return (
    <Link href={`/transactions/${t.id}`}>
      <div className="group rounded-lg border bg-white p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
        {/* Type badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            t.type === 'buyer'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-emerald-100 text-emerald-700'
          )}>
            {t.type === 'buyer' ? 'Buyer' : 'Seller'}
          </span>
          {t.under_contract_sub_phase && (
            <span className="text-xs text-gray-400 truncate max-w-[120px]">
              {getSubPhaseLabel(t.under_contract_sub_phase)}
            </span>
          )}
        </div>

        {/* Address */}
        <div className="flex items-start gap-1.5 mb-2">
          <MapPin className="h-3.5 w-3.5 mt-0.5 text-gray-400 shrink-0" />
          <p className="text-sm font-medium text-gray-900 leading-tight line-clamp-2">
            {t.property_address}
          </p>
        </div>

        {/* Due diligence */}
        {t.due_diligence_end_date && t.stage === 'under_contract' && (
          <div className={cn(
            'flex items-center gap-1 text-xs mb-1',
            ddOverdue ? 'text-red-600' : ddSoon ? 'text-amber-600' : 'text-gray-500'
          )}>
            {(ddOverdue || ddSoon) ? (
              <AlertCircle className="h-3 w-3 shrink-0" />
            ) : (
              <Clock className="h-3 w-3 shrink-0" />
            )}
            DD: {formatDate(t.due_diligence_end_date)}
            {ddDays !== null && (
              <span>({ddOverdue ? `${Math.abs(ddDays)}d ago` : `${ddDays}d`})</span>
            )}
          </div>
        )}

        {/* Closing date */}
        {t.closing_date && (
          <div className={cn(
            'flex items-center gap-1 text-xs mb-2',
            closingOverdue ? 'text-red-600' : closingSoon ? 'text-amber-600' : 'text-gray-500'
          )}>
            <Calendar className="h-3 w-3 shrink-0" />
            Close: {formatDate(t.closing_date)}
            {closingDays !== null && (
              <span>({closingOverdue ? `${Math.abs(closingDays)}d ago` : `${closingDays}d`})</span>
            )}
          </div>
        )}

        {/* Transaction manager */}
        {t.transaction_manager && (
          <p className="text-xs text-gray-400 truncate">
            TM: {t.transaction_manager.full_name}
          </p>
        )}
      </div>
    </Link>
  )
}
