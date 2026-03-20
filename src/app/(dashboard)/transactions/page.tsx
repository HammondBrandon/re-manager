import { getTransactions } from '@/lib/actions/transactions'
import { KanbanBoard } from '@/components/transactions/KanbanBoard'
import { TransactionTable } from '@/components/transactions/TransactionTable'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { LinkButton } from '@/components/ui/link-button'
import { Plus } from 'lucide-react'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ view?: string; filter?: string }>
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const view = (params.view === 'list' ? 'list' : 'kanban') as 'kanban' | 'list'
  const filter = (['buyer', 'seller'].includes(params.filter ?? '')
    ? params.filter
    : 'all') as 'all' | 'buyer' | 'seller'

  const transactions = await getTransactions()

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <p className="mt-1 text-sm text-gray-500">
            {transactions.length} active transaction{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <LinkButton href="/transactions/new">
          <Plus className="mr-1.5 h-4 w-4" /> New Transaction
        </LinkButton>
      </div>

      <div className="mb-4">
        <Suspense>
          <TransactionFilters view={view} filter={filter} />
        </Suspense>
      </div>

      {view === 'kanban' ? (
        <KanbanBoard transactions={transactions} filter={filter} />
      ) : (
        <TransactionTable transactions={transactions} filter={filter} />
      )}
    </div>
  )
}
