'use client'

import { TransactionCard } from './TransactionCard'
import { cn } from '@/lib/utils'

const COLUMNS = [
  // Buyer columns
  { id: 'pre_approval', label: 'Pre-Approval', types: ['buyer'] },
  { id: 'buyers_agreement', label: "Buyer's Agreement", types: ['buyer'] },
  { id: 'home_search', label: 'Home Search', types: ['buyer'] },
  // Seller columns
  { id: 'listing_agreement_signed', label: 'Listing Agreement', types: ['seller'] },
  { id: 'listing_photos_video', label: 'Photos / Video', types: ['seller'] },
  { id: 'live_on_market', label: 'Live on Market', types: ['seller'] },
  // Shared
  { id: 'under_contract', label: 'Under Contract', types: ['buyer', 'seller'] },
  { id: 'closed', label: 'Closed', types: ['buyer', 'seller'] },
]

interface Transaction {
  id: string
  type: 'buyer' | 'seller'
  stage: string
  under_contract_sub_phase: string | null
  property_address: string
  closing_date: string | null
  due_diligence_end_date: string | null
  transaction_manager: { full_name: string } | null
}

interface Props {
  transactions: Transaction[]
  filter: 'all' | 'buyer' | 'seller'
}

export function KanbanBoard({ transactions, filter }: Props) {
  const visibleColumns = COLUMNS.filter((col) => {
    if (filter === 'all') return true
    return col.types.includes(filter)
  })

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {visibleColumns.map((col) => {
        const cards = transactions.filter(
          (t) =>
            t.stage === col.id &&
            (filter === 'all' || t.type === filter)
        )

        const isBuyerOnly = col.types.length === 1 && col.types[0] === 'buyer'
        const isSellerOnly = col.types.length === 1 && col.types[0] === 'seller'

        return (
          <div key={col.id} className="flex flex-col w-64 shrink-0">
            <div className={cn(
              'flex items-center justify-between rounded-t-lg px-3 py-2',
              isBuyerOnly ? 'bg-blue-50 border border-blue-200' :
              isSellerOnly ? 'bg-emerald-50 border border-emerald-200' :
              'bg-gray-100 border border-gray-200'
            )}>
              <span className={cn(
                'text-xs font-semibold uppercase tracking-wide',
                isBuyerOnly ? 'text-blue-700' :
                isSellerOnly ? 'text-emerald-700' :
                'text-gray-600'
              )}>
                {col.label}
              </span>
              <span className={cn(
                'text-xs font-medium rounded-full px-1.5 py-0.5',
                isBuyerOnly ? 'bg-blue-100 text-blue-600' :
                isSellerOnly ? 'bg-emerald-100 text-emerald-600' :
                'bg-gray-200 text-gray-600'
              )}>
                {cards.length}
              </span>
            </div>
            <div className={cn(
              'flex-1 rounded-b-lg border-x border-b p-2 space-y-2 min-h-[200px]',
              isBuyerOnly ? 'border-blue-200 bg-blue-50/30' :
              isSellerOnly ? 'border-emerald-200 bg-emerald-50/30' :
              'border-gray-200 bg-gray-50/50'
            )}>
              {cards.length === 0 ? (
                <p className="text-center text-xs text-gray-400 pt-6">No transactions</p>
              ) : (
                cards.map((t) => <TransactionCard key={t.id} transaction={t} />)
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
