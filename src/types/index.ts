export type UserRole = 'admin' | 'team_member' | 'read_only'

export type TeamMemberSubRole =
  | 'personal_assistant'
  | 'transaction_manager'
  | 'social_media_manager'
  | 'video_editor'

export type Profile = {
  id: string
  email: string
  full_name: string
  role: UserRole
  sub_role: TeamMemberSubRole | null
  avatar_url: string | null
  created_at: string
}

export type TransactionType = 'buyer' | 'seller'

export type BuyerStage =
  | 'pre_approval'
  | 'buyers_agreement'
  | 'home_search'
  | 'under_contract'
  | 'closed'

export type SellerStage =
  | 'listing_agreement_signed'
  | 'listing_photos_video'
  | 'live_on_market'
  | 'under_contract'
  | 'closed'

export type UnderContractSubPhase =
  | 'offer_accepted'
  | 'due_diligence'
  | 'home_inspection'
  | 'repair_requests'
  | 'financing_contingency'
  | 'appraisal'
  | 'loan_approval'
  | 'final_walkthrough'
  | 'closing'
  // Seller-specific
  | 'inspection_response'
  | 'repair_negotiation'

export type Transaction = {
  id: string
  type: TransactionType
  stage: BuyerStage | SellerStage
  under_contract_sub_phase: UnderContractSubPhase | null
  transaction_manager_id: string | null
  property_address: string
  under_contract_date: string | null
  closing_date: string | null
  due_diligence_days: number
  due_diligence_end_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type ContactType = 'client' | 'lender' | 'realtor' | 'contractor'

export type ClientRating = 'A+' | 'A' | 'B' | 'C'

export type Contact = {
  id: string
  type: ContactType
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  second_email: string | null
  second_phone: string | null
  company: string | null
  client_rating: ClientRating | null
  source: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  birthday: string | null
  anniversary: string | null
  spouse_first_name: string | null
  spouse_last_name: string | null
  spouse_email: string | null
  spouse_phone: string | null
  notes: string | null
  created_at: string
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'needs_review'

export type Task = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  assigned_to: string
  assigned_by: string
  transaction_id: string | null
  due_date: string | null
  follow_up_date: string | null
  review_requested_from: string | null
  created_at: string
  updated_at: string
}
