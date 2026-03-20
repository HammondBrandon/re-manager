'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { deleteTransaction } from '@/lib/actions/transactions'

interface Props {
  id: string
  address: string
}

export function DeleteTransactionButton({ id, address }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Delete "${address}"? This will also remove all associated tasks and files. This cannot be undone.`)) return
    setLoading(true)
    try {
      await deleteTransaction(id)
      toast.success('Transaction deleted')
      router.push('/transactions')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 className="mr-1.5 h-4 w-4" />
      {loading ? 'Deleting…' : 'Delete'}
    </Button>
  )
}
