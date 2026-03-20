import { getTransactions } from '@/lib/actions/transactions'
import { getTasks } from '@/lib/actions/tasks'
import { DashboardViewToggle } from '@/components/dashboard/DashboardViewToggle'
import { createClient } from '@/lib/supabase/server'
import { daysUntil } from '@/lib/utils/dates'
import { ArrowLeftRight, CheckSquare, AlertCircle, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  const [transactions, tasks] = await Promise.all([
    getTransactions(),
    getTasks(isAdmin ? undefined : 'mine'),
  ])

  // Stats
  const activeTransactions = transactions.filter((t) => t.stage !== 'closed')
  const activeTasks = (tasks as Array<{ status: string; due_date: string | null }>)
    .filter((t) => t.status !== 'completed')
  const overdueTasks = activeTasks.filter((t) => {
    const d = daysUntil(t.due_date)
    return d !== null && d < 0
  })
  const closingThisMonth = transactions.filter((t) => {
    const d = daysUntil(t.closing_date)
    return d !== null && d >= 0 && d <= 30
  })

  const stats = [
    { label: 'Active Transactions', value: activeTransactions.length, icon: ArrowLeftRight, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Open Tasks', value: activeTasks.length, icon: CheckSquare, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Overdue Tasks', value: overdueTasks.length, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Closings (30d)', value: closingThisMonth.length, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  // Shape for client components
  const txForKanban = transactions.map((t) => ({
    id: t.id,
    type: t.type,
    stage: t.stage,
    under_contract_sub_phase: t.under_contract_sub_phase,
    property_address: t.property_address,
    closing_date: t.closing_date,
    due_diligence_end_date: t.due_diligence_end_date,
    transaction_manager: t.transaction_manager ?? null,
  }))

  const tasksForView = (tasks as Array<Record<string, unknown>>).map((t) => ({
    id: t.id as string,
    title: t.title as string,
    status: t.status as string,
    due_date: t.due_date as string | null,
    transaction_id: t.transaction_id as string | null,
    assignee: t.assignee as { full_name: string } | null,
    transaction: t.transaction as { id: string; property_address: string } | null,
  }))

  const txForToday = transactions.map((t) => ({
    id: t.id,
    type: t.type,
    property_address: t.property_address,
    closing_date: t.closing_date,
    transaction_manager: t.transaction_manager ?? null,
  }))

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          {isAdmin ? 'Overview of all team activity' : 'Your tasks and upcoming activity'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
              <span className={cn('rounded-md p-1.5', stat.bg)}>
                <stat.icon className={cn('h-4 w-4', stat.color)} />
              </span>
            </div>
            <p className={cn('text-3xl font-bold', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Kanban / Today toggle */}
      <DashboardViewToggle
        transactions={txForKanban}
        tasks={tasksForView}
        txForToday={txForToday}
      />
    </div>
  )
}
