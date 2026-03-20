import { BuyerStage, SellerStage, UnderContractSubPhase } from '@/types'

export const BUYER_STAGES: { value: BuyerStage; label: string }[] = [
  { value: 'pre_approval', label: 'Pre-Approval' },
  { value: 'buyers_agreement', label: "Buyer's Agreement" },
  { value: 'home_search', label: 'Home Search' },
  { value: 'under_contract', label: 'Under Contract' },
  { value: 'closed', label: 'Closed' },
]

export const SELLER_STAGES: { value: SellerStage; label: string }[] = [
  { value: 'listing_agreement_signed', label: 'Listing Agreement Signed' },
  { value: 'listing_photos_video', label: 'Listing Photos/Video' },
  { value: 'live_on_market', label: 'Live on Market' },
  { value: 'under_contract', label: 'Under Contract' },
  { value: 'closed', label: 'Closed' },
]

export const BUYER_SUB_PHASES: { value: UnderContractSubPhase; label: string }[] = [
  { value: 'offer_accepted', label: 'Offer Accepted' },
  { value: 'due_diligence', label: 'Due Diligence Period' },
  { value: 'home_inspection', label: 'Home Inspection' },
  { value: 'repair_requests', label: 'Repair Requests / Negotiations' },
  { value: 'financing_contingency', label: 'Financing Contingency' },
  { value: 'appraisal', label: 'Appraisal' },
  { value: 'loan_approval', label: 'Loan Approval / Clear to Close' },
  { value: 'final_walkthrough', label: 'Final Walkthrough' },
  { value: 'closing', label: 'Closing' },
]

export const SELLER_SUB_PHASES: { value: UnderContractSubPhase; label: string }[] = [
  { value: 'offer_accepted', label: 'Offer Accepted' },
  { value: 'due_diligence', label: 'Due Diligence Period' },
  { value: 'inspection_response', label: 'Inspection Response' },
  { value: 'repair_negotiation', label: 'Repair Negotiation' },
  { value: 'appraisal', label: 'Appraisal' },
  { value: 'closing', label: 'Closing' },
]

export function getStageLabelBuyer(stage: string): string {
  return BUYER_STAGES.find((s) => s.value === stage)?.label ?? stage
}

export function getStageLabelSeller(stage: string): string {
  return SELLER_STAGES.find((s) => s.value === stage)?.label ?? stage
}

export function getStageLabel(type: 'buyer' | 'seller', stage: string): string {
  return type === 'buyer' ? getStageLabelBuyer(stage) : getStageLabelSeller(stage)
}

export function getSubPhaseLabel(subPhase: string): string {
  const all = [...BUYER_SUB_PHASES, ...SELLER_SUB_PHASES]
  return all.find((s) => s.value === subPhase)?.label ?? subPhase
}

export const STAGE_ORDER_BUYER: BuyerStage[] = [
  'pre_approval',
  'buyers_agreement',
  'home_search',
  'under_contract',
  'closed',
]

export const STAGE_ORDER_SELLER: SellerStage[] = [
  'listing_agreement_signed',
  'listing_photos_video',
  'live_on_market',
  'under_contract',
  'closed',
]

// All unique stages for kanban columns (combined view)
export const KANBAN_COLUMNS = [
  { id: 'pre_approval', label: 'Pre-Approval', type: 'buyer' as const },
  { id: 'buyers_agreement', label: "Buyer's Agreement", type: 'buyer' as const },
  { id: 'listing_agreement_signed', label: 'Listing Agreement', type: 'seller' as const },
  { id: 'listing_photos_video', label: 'Photos/Video', type: 'seller' as const },
  { id: 'home_search', label: 'Home Search', type: 'buyer' as const },
  { id: 'live_on_market', label: 'Live on Market', type: 'seller' as const },
  { id: 'under_contract', label: 'Under Contract', type: 'both' as const },
  { id: 'closed', label: 'Closed', type: 'both' as const },
]
