'use client'

import Link from 'next/link'
import { toast } from 'sonner'
import { formatDate, isOverdue, isDueSoon } from '@/lib/utils/dates'
import { getStageLabel } from '@/lib/utils/transactions'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { deleteTransaction } from '@/lib/actions/transactions'
import { useRouter } from 'next/navigation'

interface Transaction {
  id: string
  type: 'buyer' | 'seller'
  stage: string
  property_address: string
  closing_date: string | null
  due_diligence_end_date: string | null
  transaction_manager: { full_name: string } | null
}

interface Props {
  transactions: Transaction[]
  filter: 'all' | 'buyer' | 'seller'
}

export function TransactionTable({ transactions, filter }: Props) {
  const router = useRouter()
  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter)

  async function handleDelete(id: string, address: string) {
    if (!confirm(`Delete "${address}"? This will also remove all associated tasks and files. This cannot be undone.`)) return
    try {
      await deleteTransaction(id)
      toast.success('Transaction deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Due Diligence End</TableHead>
            <TableHead>Closing Date</TableHead>
            <TableHead>Transaction Manager</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-sm text-gray-400">
                No transactions yet
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((t) => {
              const closingOverdue = isOverdue(t.closing_date)
              const closingSoon = isDueSoon(t.closing_date, 7)
              return (
                <TableRow key={t.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell>
                    <Link href={`/transactions/${t.id}`} className="font-medium hover:underline">
                      {t.property_address}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      t.type === 'buyer' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                    )}>
                      {t.type === 'buyer' ? 'Buyer' : 'Seller'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {getStageLabel(t.type, t.stage)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(t.due_diligence_end_date)}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      'text-sm',
                      closingOverdue ? 'text-red-600 font-medium' :
                      closingSoon ? 'text-amber-600 font-medium' : 'text-gray-500'
                    )}>
                      {formatDate(t.closing_date)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {t.transaction_manager?.full_name ?? '—'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/transactions/${t.id}`)}>
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(t.id, t.property_address)}
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
  )
}
