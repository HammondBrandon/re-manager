'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { SocialPost, SocialPlatform, SocialPostStatus } from '@/lib/utils/social'

export async function getSocialPosts(): Promise<SocialPost[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('social_posts')
    .select('*, transaction:transaction_id(id, property_address)')
    .order('scheduled_at', { ascending: true, nullsFirst: false })
  if (error) throw new Error(error.message)
  return data as SocialPost[]
}

export async function createSocialPost(values: {
  title: string
  caption?: string
  platform: SocialPlatform[]
  status: SocialPostStatus
  scheduled_at?: string
  transaction_id?: string
  notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('social_posts').insert({
    title: values.title,
    caption: values.caption || null,
    platform: values.platform,
    status: values.status,
    scheduled_at: values.scheduled_at || null,
    transaction_id: values.transaction_id || null,
    notes: values.notes || null,
    created_by: user.id,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/social')
}

export async function updateSocialPost(id: string, values: {
  title: string
  caption?: string
  platform: SocialPlatform[]
  status: SocialPostStatus
  scheduled_at?: string
  transaction_id?: string
  notes?: string
}) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('social_posts')
    .update({
      title: values.title,
      caption: values.caption || null,
      platform: values.platform,
      status: values.status,
      scheduled_at: values.scheduled_at || null,
      transaction_id: values.transaction_id || null,
      notes: values.notes || null,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/social')
}

export async function deleteSocialPost(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('social_posts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/social')
}
