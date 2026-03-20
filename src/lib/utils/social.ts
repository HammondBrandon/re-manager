export type SocialPlatform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok' | 'other'
export type SocialPostStatus = 'draft' | 'scheduled' | 'published' | 'cancelled'

export type SocialPost = {
  id: string
  title: string
  caption: string | null
  platform: SocialPlatform[]
  status: SocialPostStatus
  scheduled_at: string | null
  published_at: string | null
  transaction_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  transaction: { id: string; property_address: string } | null
}

export const PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'other', label: 'Other' },
]

export const POST_STATUSES: { value: SocialPostStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-400' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-500' },
  { value: 'published', label: 'Published', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-400' },
]
