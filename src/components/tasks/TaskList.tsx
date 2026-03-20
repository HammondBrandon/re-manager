'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { TaskStatusBadge } from './TaskStatusBadge'
import { TaskForm } from './TaskForm'
import { updateTaskStatus, deleteTask } from '@/lib/actions/tasks'
import { formatDate, isOverdue, isDueSoon } from '@/lib/utils/dates'
import { TaskStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, MoreHorizontal, Zap, Calendar, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  due_date: string | null
  follow_up_date: string | null
  is_auto_assigned: boolean
  assigned_to: string
  assigned_by: string | null
  review_requested_from: string | null
  transaction_id: string | null
  assignee: { id: string; full_name: string } | null
  assigner: { id: string; full_name: string } | null
  reviewer: { id: string; full_name: string } | null
  transaction: { id: string; property_address: string; type: string } | null
}

interface Props {
  tasks: Task[]
  teamMembers: { id: string; full_name: string }[]
  transactions: { id: string; property_address: string }[]
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'needs_review', label: 'Needs Review' },
]

export function TaskList({ tasks, teamMembers, transactions }: Props) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'needs_review' | 'completed'>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  const router = useRouter()

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)

  async function handleStatusChange(id: string, status: TaskStatus) {
    try {
      await updateTaskStatus(id, status)
      toast.success('Status updated')
      router.refresh()
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this task?')) return
    try {
      await deleteTask(id)
      toast.success('Task deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    needs_review: tasks.filter((t) => t.status === 'needs_review').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={(v) => v && setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({counts.in_progress})</TabsTrigger>
            <TabsTrigger value="needs_review">Needs Review ({counts.needs_review})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" onClick={() => { setEditingTask(undefined); setFormOpen(true) }}>
          <Plus className="mr-1.5 h-4 w-4" /> New Task
        </Button>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Transaction</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Review</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-400">
                  No tasks
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((task) => {
                const overdue = isOverdue(task.due_date) && task.status !== 'completed'
                const dueSoon = isDueSoon(task.due_date, 2) && task.status !== 'completed'
                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="flex items-start gap-1.5">
                        {task.is_auto_assigned && (
                          <Zap className="h-3.5 w-3.5 mt-0.5 text-amber-400 shrink-0" aria-label="Auto-assigned" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-gray-400 line-clamp-1">{task.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="cursor-pointer">
                          <TaskStatusBadge status={task.status} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {STATUS_OPTIONS.map((s) => (
                            <DropdownMenuItem
                              key={s.value}
                              onClick={() => handleStatusChange(task.id, s.value)}
                            >
                              {s.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {task.assignee?.full_name ?? '—'}
                    </TableCell>
                    <TableCell>
                      {task.transaction ? (
                        <Link
                          href={`/transactions/${task.transaction.id}`}
                          className="text-xs text-blue-600 hover:underline line-clamp-1 max-w-[140px] block"
                        >
                          {task.transaction.property_address}
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        'flex items-center gap-1 text-xs',
                        overdue ? 'text-red-600 font-medium' :
                        dueSoon ? 'text-amber-600 font-medium' : 'text-gray-500'
                      )}>
                        {(overdue || dueSoon) && <AlertCircle className="h-3 w-3" />}
                        {formatDate(task.due_date)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {task.reviewer?.full_name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingTask(task); setFormOpen(true) }}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(task.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <TaskForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingTask(undefined) }}
        teamMembers={teamMembers}
        transactions={transactions}
        editTask={editingTask}
      />
    </div>
  )
}
