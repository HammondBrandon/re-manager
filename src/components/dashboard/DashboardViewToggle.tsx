'use client'

import { useState } from 'react'
import { KanbanBoard } from '@/components/transactions/KanbanBoard'
import { TodayView } from '@/components/dashboard/TodayView'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutDashboard, CalendarDays } from 'lucide-react'

type KanbanFilter = 'all' | 'buyer' | 'seller'

interface Props {
  transactions: Parameters<typeof KanbanBoard>[0]['transactions']
  tasks: Parameters<typeof TodayView>[0]['tasks']
  txForToday: Parameters<typeof TodayView>[0]['transactions']
}

export function DashboardViewToggle({ transactions, tasks, txForToday }: Props) {
  const [view, setView] = useState<'kanban' | 'today'>('kanban')
  const [kanbanFilter, setKanbanFilter] = useState<KanbanFilter>('all')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* View toggle */}
        <Tabs value={view} onValueChange={(v) => v && setView(v as 'kanban' | 'today')}>
          <TabsList>
            <TabsTrigger value="kanban">
              <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="today">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
              Today / Upcoming
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Kanban filter (only shown in kanban view) */}
        {view === 'kanban' && (
          <Tabs value={kanbanFilter} onValueChange={(v) => v && setKanbanFilter(v as KanbanFilter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="buyer">Buyers</TabsTrigger>
              <TabsTrigger value="seller">Sellers</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {view === 'kanban' ? (
        <KanbanBoard transactions={transactions} filter={kanbanFilter} />
      ) : (
        <TodayView tasks={tasks} transactions={txForToday} />
      )}
    </div>
  )
}
