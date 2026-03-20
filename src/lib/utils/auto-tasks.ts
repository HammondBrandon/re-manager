// Auto-task templates triggered when a transaction moves to a new stage/sub-phase

interface TaskTemplate {
  title: string
  description?: string
}

export const BUYER_STAGE_TASKS: Record<string, TaskTemplate[]> = {
  pre_approval: [
    { title: 'Follow up on pre-approval status', description: 'Check in with client on pre-approval progress.' },
    { title: 'Collect pre-approval letter', description: 'Request pre-approval letter from lender once approved.' },
  ],
  buyers_agreement: [
    { title: "Send Buyer's Agreement for signature", description: "Prepare and send the Buyer's Representation Agreement." },
    { title: "File signed Buyer's Agreement", description: "Save signed agreement to transaction folder." },
  ],
  home_search: [
    { title: 'Send updated listings to client', description: 'Pull new listings matching buyer criteria and send.' },
    { title: 'Schedule property showings', description: 'Coordinate showing times with client.' },
  ],
  // Under contract sub-phases
  offer_accepted: [
    { title: 'Send congratulations email to client', description: 'Notify client that offer was accepted.' },
    { title: 'Schedule home inspection', description: 'Book inspector and confirm time with all parties.' },
    { title: 'Send under contract email to lender', description: 'Notify lender that client is under contract with property details.' },
  ],
  due_diligence: [
    { title: 'Confirm due diligence period dates', description: 'Verify DD start and end dates with all parties.' },
  ],
  home_inspection: [
    { title: 'Confirm inspection appointment', description: 'Send confirmation details to client and agent.' },
    { title: 'Attend inspection or coordinate access', description: 'Ensure property is accessible for inspector.' },
  ],
  repair_requests: [
    { title: 'Review inspection report with client', description: 'Walk client through findings and discuss repair requests.' },
    { title: 'Submit repair request to listing agent', description: 'Draft and send repair request before DD deadline.' },
  ],
  financing_contingency: [
    { title: 'Follow up with lender on loan status', description: 'Check in with lender on loan processing progress.' },
    { title: 'Submit appraisal order', description: 'Confirm appraisal has been ordered by lender.' },
  ],
  appraisal: [
    { title: 'Confirm appraisal appointment', description: 'Verify appraisal date and ensure property access.' },
    { title: 'Follow up on appraisal results', description: 'Obtain appraisal report and review with client.' },
  ],
  loan_approval: [
    { title: 'Confirm Clear to Close with lender', description: 'Verify CTC has been issued and no outstanding conditions.' },
    { title: 'Confirm closing date and time', description: 'Coordinate closing appointment with title company.' },
  ],
  final_walkthrough: [
    { title: 'Schedule final walkthrough with client', description: 'Confirm walkthrough time 1-2 days before closing.' },
    { title: 'Verify all repairs completed', description: 'Confirm seller completed agreed-upon repairs before walkthrough.' },
  ],
  closing: [
    { title: 'Confirm wire transfer instructions with client', description: 'Send verified wire instructions — warn against wire fraud.' },
    { title: 'Prepare closing gift', description: 'Order or prepare closing gift for client.' },
    { title: 'Send congratulations and thank you note', description: 'Send post-closing thank you to client.' },
  ],
}

export const SELLER_STAGE_TASKS: Record<string, TaskTemplate[]> = {
  listing_agreement_signed: [
    { title: 'Order listing photos', description: 'Schedule professional photographer for the property.' },
    { title: 'Order listing video', description: 'Schedule videographer or coordinate drone footage.' },
    { title: 'Prepare MLS listing draft', description: 'Write listing description and gather all property details.' },
  ],
  listing_photos_video: [
    { title: 'Review listing photos with realtor', description: 'Select best photos for MLS and marketing.' },
    { title: 'Finalize listing description', description: 'Review and approve listing copy before going live.' },
  ],
  live_on_market: [
    { title: 'Send just listed emails/posts', description: 'Distribute just listed announcement to sphere and social media.' },
    { title: 'Schedule open house', description: 'Set open house date and promote across channels.' },
    { title: 'Confirm listing is live on all platforms', description: 'Verify Zillow, Realtor.com, and MLS are updated.' },
  ],
  offer_accepted: [
    { title: 'Send congratulations email to seller', description: 'Notify seller that their home is under contract.' },
    { title: 'Notify seller of inspection scheduling', description: 'Let seller know when inspection will take place.' },
    { title: 'Confirm earnest money receipt', description: 'Verify earnest money has been received by title company.' },
  ],
  inspection_response: [
    { title: 'Review inspection report with seller', description: 'Walk seller through buyer inspection findings.' },
    { title: 'Prepare seller response to repair requests', description: 'Draft response to buyer repair request before deadline.' },
  ],
  repair_negotiation: [
    { title: 'Finalize repair negotiation', description: 'Confirm agreed repairs or credits with buyer agent.' },
    { title: 'Schedule agreed repairs', description: 'Coordinate contractors for any repairs seller agreed to.' },
  ],
  appraisal: [
    { title: 'Confirm appraisal access to property', description: 'Ensure property is accessible for appraiser.' },
    { title: 'Prepare comparable sales for appraiser', description: 'Pull recent comps to support listing price.' },
  ],
  closing: [
    { title: 'Confirm closing details with seller', description: 'Review net sheet and closing time with seller.' },
    { title: 'Remind seller to transfer utilities', description: 'Ensure seller cancels or transfers utilities at closing.' },
    { title: 'Send congratulations and thank you note', description: 'Post-closing thank you and request for review.' },
  ],
}

export function getAutoTasks(
  transactionType: 'buyer' | 'seller',
  stage: string,
  subPhase?: string | null
): TaskTemplate[] {
  const templates = transactionType === 'buyer' ? BUYER_STAGE_TASKS : SELLER_STAGE_TASKS
  // Sub-phase tasks take priority when under contract
  if (stage === 'under_contract' && subPhase && templates[subPhase]) {
    return templates[subPhase]
  }
  return templates[stage] ?? []
}
