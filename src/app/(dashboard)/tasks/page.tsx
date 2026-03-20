import { getTasks } from '@/lib/actions/tasks'
import { getTeamMembers, getTransactions } from '@/lib/actions/transactions'
import { TaskList } from '@/components/tasks/TaskList'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ filter?: string }>
}

export default async function TasksPage({ searchParams }: PageProps) {
  const params = await searchParams
  const filter = params.filter === 'review' ? 'review'
    : params.filter === 'mine' ? 'mine'
    : undefined

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  const [tasks, teamMembers, transactions] = await Promise.all([
    getTasks(isAdmin ? undefined : 'mine'),
    getTeamMembers(),
    getTransactions(),
  ])

  const transactionList = transactions.map((t) => ({
    id: t.id,
    property_address: t.property_address,
  }))

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="mt-1 text-sm text-gray-500">
          {isAdmin ? 'All team tasks' : 'Tasks assigned to you'}
        </p>
      </div>
      <TaskList
        tasks={tasks}
        teamMembers={teamMembers}
        transactions={transactionList}
      />
    </div>
  )
}
