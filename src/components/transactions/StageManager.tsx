'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateTransactionStage } from '@/lib/actions/transactions'
import { BUYER_STAGES, SELLER_STAGES, BUYER_SUB_PHASES, SELLER_SUB_PHASES } from '@/lib/utils/transactions'
import { BuyerStage, SellerStage, UnderContractSubPhase } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  transactionId: string
  type: 'buyer' | 'seller'
  currentStage: string
  currentSubPhase: string | null
}

export function StageManager({ transactionId, type, currentStage, currentSubPhase }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const stages = type === 'buyer' ? BUYER_STAGES : SELLER_STAGES
  const subPhases = type === 'buyer' ? BUYER_SUB_PHASES : SELLER_SUB_PHASES
  const currentIndex = stages.findIndex((s) => s.value === currentStage)
  const isUnderContract = currentStage === 'under_contract'

  async function moveToStage(stage: BuyerStage | SellerStage) {
    setLoading(true)
    try {
      await updateTransactionStage(transactionId, stage, null)
      toast.success('Stage updated')
      router.refresh()
    } catch {
      toast.error('Failed to update stage')
    } finally {
      setLoading(false)
    }
  }

  async function updateSubPhase(subPhase: UnderContractSubPhase) {
    setLoading(true)
    try {
      await updateTransactionStage(transactionId, 'under_contract', subPhase)
      toast.success('Sub-phase updated')
      router.refresh()
    } catch {
      toast.error('Failed to update sub-phase')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Stage progress bar */}
      <div className="flex items-center gap-1">
        {stages.map((stage, i) => (
          <div key={stage.value} className="flex items-center gap-1 flex-1 min-w-0">
            <button
              onClick={() => moveToStage(stage.value as BuyerStage | SellerStage)}
              disabled={loading || stage.value === currentStage}
              className={cn(
                'flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors truncate',
                stage.value === currentStage
                  ? type === 'buyer'
                    ? 'bg-blue-600 text-white'
                    : 'bg-emerald-600 text-white'
                  : i < currentIndex
                    ? type === 'buyer'
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              )}
            >
              {stage.label}
            </button>
            {i < stages.length - 1 && (
              <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-2">
        {currentIndex > 0 && currentStage !== 'closed' && (
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => moveToStage(stages[currentIndex - 1].value as BuyerStage | SellerStage)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {stages[currentIndex - 1].label}
          </Button>
        )}
        {/* For buyers: allow reverting from under_contract to home_search */}
        {type === 'buyer' && currentStage === 'under_contract' && (
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => moveToStage('home_search')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Home Search
          </Button>
        )}
        {currentIndex < stages.length - 1 && (
          <Button
            size="sm"
            disabled={loading}
            onClick={() => moveToStage(stages[currentIndex + 1].value as BuyerStage | SellerStage)}
          >
            Move to {stages[currentIndex + 1].label}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Sub-phase selector (only when under contract) */}
      {isUnderContract && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Under Contract Sub-Phase</p>
          <Select
            value={currentSubPhase ?? ''}
            onValueChange={(v) => v && updateSubPhase(v as UnderContractSubPhase)}
          >
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Select sub-phase" />
            </SelectTrigger>
            <SelectContent>
              {subPhases.map((sp) => (
                <SelectItem key={sp.value} value={sp.value}>{sp.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
