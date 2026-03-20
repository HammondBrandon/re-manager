export type EmailTemplate = {
  id: string
  label: string
  subject: string
  body: string
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'general',
    label: 'General / Blank',
    subject: '',
    body: 'Hi {{name}},\n\n\n\nBest regards,\n{{agent_name}}',
  },
  {
    id: 'pre_approval_intro',
    label: 'Pre-Approval Introduction',
    subject: 'Getting Started – Pre-Approval',
    body: 'Hi {{name}},\n\nI\'m excited to work with you on finding your new home. The first step is getting pre-approved for a mortgage. I\'d recommend reaching out to your lender to start that process.\n\nPlease let me know if you have any questions or need lender recommendations.\n\nBest regards,\n{{agent_name}}',
  },
  {
    id: 'offer_submitted',
    label: 'Offer Submitted',
    subject: 'Your Offer Has Been Submitted',
    body: 'Hi {{name}},\n\nGreat news! Your offer has been submitted on the property. I\'ll keep you updated on any response from the seller.\n\nPlease feel free to reach out with any questions.\n\nBest regards,\n{{agent_name}}',
  },
  {
    id: 'under_contract',
    label: 'Under Contract Congratulations',
    subject: 'Congratulations – You\'re Under Contract!',
    body: 'Hi {{name}},\n\nCongratulations! Your offer has been accepted and you are now officially under contract. Here\'s what to expect next:\n\n- Due diligence period begins\n- Home inspection will be scheduled\n- Financing process continues\n\nI\'ll be in touch with next steps. This is an exciting milestone!\n\nBest regards,\n{{agent_name}}',
  },
  {
    id: 'inspection_scheduled',
    label: 'Inspection Scheduled',
    subject: 'Home Inspection Scheduled',
    body: 'Hi {{name}},\n\nYour home inspection has been scheduled. Please plan to attend if possible — it\'s a great opportunity to learn about the property firsthand.\n\nI\'ll share the full report as soon as it\'s ready.\n\nBest regards,\n{{agent_name}}',
  },
  {
    id: 'closing_reminder',
    label: 'Closing Day Reminder',
    subject: 'Closing Day Reminder',
    body: 'Hi {{name}},\n\nYour closing date is coming up! Here\'s a quick reminder of what to bring:\n\n- Government-issued photo ID\n- Certified funds or wire transfer confirmation\n- Any outstanding documents requested by the title company\n\nPlease don\'t hesitate to reach out if you have any questions before closing day.\n\nBest regards,\n{{agent_name}}',
  },
  {
    id: 'listing_live',
    label: 'Listing is Live',
    subject: 'Your Home is Now Live on the Market',
    body: 'Hi {{name}},\n\nExciting news — your property is now live on the market! The listing has been published to the MLS and major real estate websites.\n\nI\'ll keep you updated on showings and feedback from prospective buyers.\n\nBest regards,\n{{agent_name}}',
  },
  {
    id: 'offer_received',
    label: 'Offer Received (Seller)',
    subject: 'You\'ve Received an Offer!',
    body: 'Hi {{name}},\n\nWe\'ve received an offer on your property! I\'ll be reaching out shortly to review the details and discuss your options.\n\nPlease feel free to call or email me with any questions in the meantime.\n\nBest regards,\n{{agent_name}}',
  },
]

/** Replace {{name}} and {{agent_name}} placeholders in a template body */
export function fillTemplate(body: string, name: string, agentName: string): string {
  return body
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{agent_name\}\}/g, agentName)
}

/** Convert plain text body to simple HTML for sending via Resend */
export function textToHtml(text: string): string {
  return text
    .split('\n')
    .map((line) => `<p>${line || '&nbsp;'}</p>`)
    .join('')
}
