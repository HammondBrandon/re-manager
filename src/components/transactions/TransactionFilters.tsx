'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  view: 'kanban' | 'list'
  filter: 'all' | 'buyer' | 'seller'
}

export function TransactionFilters({ view, filter }: Props) {
  const router = useRouter()
  const params = useSearchParams()

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    next.set(key, value)
    router.push(`/transactions?${next.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <Tabs value={filter} onValueChange={(v) => update('filter', v)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="buyer">Buyers</TabsTrigger>
          <TabsTrigger value="seller">Sellers</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex rounded-md border bg-white">
        <button
          onClick={() => update('view', 'kanban')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-l-md transition-colors',
            view === 'kanban' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'
          )}
        >
          <LayoutGrid className="h-4 w-4" /> Kanban
        </button>
        <button
          onClick={() => update('view', 'list')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-r-md border-l transition-colors',
            view === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'
          )}
        >
          <List className="h-4 w-4" /> List
        </button>
      </div>
    </div>
  )
}
