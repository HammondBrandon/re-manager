import { getTeamMembers } from '@/lib/actions/transactions'
import { NewTransactionForm } from '@/components/transactions/NewTransactionForm'

export const dynamic = 'force-dynamic'

export default async function NewTransactionPage() {
  const teamMembers = await getTeamMembers()
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">New Transaction</h1>
        <p className="mt-1 text-sm text-gray-500">Create a buyer or seller transaction</p>
      </div>
      <NewTransactionForm teamMembers={teamMembers} />
    </div>
  )
}
