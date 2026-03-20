'use client'

import Link from 'next/link'
import { formatDate, daysUntil } from '@/lib/utils/dates'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import { Calendar, CheckSquare, AlertCircle, Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
  status: string
  due_date: string | null
  transaction_id: string | null
  assignee: { full_name: string } | null
  transaction: { id: string; property_address: string } | null
}

interface Transaction {
  id: string
  type: 'buyer' | 'seller'
  property_address: string
  closing_date: string | null
  transaction_manager: { full_name: string } | null
}

interface Props {
  tasks: Task[]
  transactions: Transaction[]
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false
  const today = new Date()
  const d = new Date(dateStr)
  return d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
}

function isThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false
  const days = daysUntil(dateStr)
  return days !== null && days > 0 && days <= 7
}

function isOverdueDate(dateStr: string | null): boolean {
  if (!dateStr) return false
  const days = daysUntil(dateStr)
  return days !== null && days < 0
}

export function TodayView({ tasks, transactions }: Props) {
  const activeTasks = tasks.filter((t) => t.status !== 'completed')

  const overdueTasks = activeTasks.filter((t) => isOverdueDate(t.due_date))
  const todayTasks = activeTasks.filter((t) => isToday(t.due_date))
  const weekTasks = activeTasks.filter((t) => isThisWeek(t.due_date))
  const noDateTasks = activeTasks.filter((t) => !t.due_date)

  const upcomingClosings = transactions.filter((t) => {
    const days = daysUntil(t.closing_date)
    return days !== null && days >= 0 && days <= 30
  }).sort((a, b) => (daysUntil(a.closing_date) ?? 999) - (daysUntil(b.closing_date) ?? 999))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Tasks column (spans 2) */}
      <div className="lg:col-span-2 space-y-6">

        {/* Overdue */}
        {overdueTasks.length > 0 && (
          <Section
            icon={<AlertCircle className="h-4 w-4 text-red-500" />}
            title="Overdue"
            count={overdueTasks.length}
            accent="red"
          >
            {overdueTasks.map((task) => <TaskRow key={task.id} task={task} accent="red" />)}
          </Section>
        )}

        {/* Today */}
        <Section
          icon={<CheckSquare className="h-4 w-4 text-blue-500" />}
          title="Due Today"
          count={todayTasks.length}
          accent="blue"
        >
          {todayTasks.length === 0
            ? <p className="text-sm text-gray-400 py-3 text-center">Nothing due today</p>
            : todayTasks.map((task) => <TaskRow key={task.id} task={task} accent="blue" />)
          }
        </Section>

        {/* This week */}
        {weekTasks.length > 0 && (
          <Section
            icon={<Clock className="h-4 w-4 text-amber-500" />}
            title="Due This Week"
            count={weekTasks.length}
            accent="amber"
          >
            {weekTasks.map((task) => <TaskRow key={task.id} task={task} accent="amber" />)}
          </Section>
        )}

        {/* No date */}
        {noDateTasks.length > 0 && (
          <Section
            icon={<CheckSquare className="h-4 w-4 text-gray-400" />}
            title="No Due Date"
            count={noDateTasks.length}
            accent="gray"
          >
            {noDateTasks.map((task) => <TaskRow key={task.id} task={task} accent="gray" />)}
          </Section>
        )}

        {activeTasks.length === 0 && (
          <div className="rounded-lg border bg-white py-16 text-center">
            <CheckSquare className="mx-auto h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">All caught up!</p>
            <p className="text-xs text-gray-400 mt-1">No open tasks.</p>
          </div>
        )}
      </div>

      {/* Upcoming closings */}
      <div>
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold">Upcoming Closings</span>
            {upcomingClosings.length > 0 && (
              <span className="ml-auto text-xs text-gray-400">{upcomingClosings.length}</span>
            )}
          </div>
          <div className="divide-y">
            {upcomingClosings.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No closings in the next 30 days</p>
            ) : (
              upcomingClosings.map((tx) => {
                const days = daysUntil(tx.closing_date)
                const urgent = days !== null && days <= 7
                return (
                  <Link key={tx.id} href={`/transactions/${tx.id}`} className="block px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                          <p className="text-sm font-medium truncate">{tx.property_address}</p>
                        </div>
                        <p className="text-xs text-gray-400">{tx.transaction_manager?.full_name ?? '—'}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={cn('text-xs font-semibold', urgent ? 'text-red-600' : 'text-gray-700')}>
                          {days === 0 ? 'Today' : `${days}d`}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(tx.closing_date)}</p>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({
  icon, title, count, accent, children,
}: {
  icon: React.ReactNode
  title: string
  count: number
  accent: 'red' | 'blue' | 'amber' | 'gray'
  children: React.ReactNode
}) {
  const borderColor = {
    red: 'border-red-200',
    blue: 'border-blue-200',
    amber: 'border-amber-200',
    gray: 'border-gray-200',
  }[accent]

  return (
    <div className={cn('rounded-lg border bg-white overflow-hidden', borderColor)}>
      <div className="flex items-center gap-2 border-b px-4 py-3">
        {icon}
        <span className="text-sm font-semibold">{title}</span>
        <span className="ml-auto text-xs text-gray-400">{count}</span>
      </div>
      <div className="divide-y">{children}</div>
    </div>
  )
}

function TaskRow({ task, accent }: { task: Task; accent: string }) {
  return (
    <Link href="/tasks" className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-gray-50">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{task.title}</p>
        {task.transaction && (
          <p className="text-xs text-gray-400 truncate">{task.transaction.property_address}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {task.due_date && (
          <span className={cn(
            'text-xs',
            accent === 'red' ? 'text-red-500' : 'text-gray-400'
          )}>
            {formatDate(task.due_date)}
          </span>
        )}
        <TaskStatusBadge status={task.status as never} />
      </div>
    </Link>
  )
}
