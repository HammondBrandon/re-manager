'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { FileCategory } from '@/lib/utils/files'

const BUCKET = 'transaction-files'
const MAX_BYTES = 50 * 1024 * 1024 // 50 MB

export async function getFiles(transactionId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('files')
    .select('*, uploader:uploaded_by(full_name)')
    .eq('transaction_id', transactionId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data as Array<{
    id: string
    name: string
    storage_path: string
    mime_type: string | null
    size_bytes: number | null
    folder: string | null
    created_at: string
    uploader: { full_name: string } | null
  }>
}

export async function getAllFiles() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('files')
    .select('*, uploader:uploaded_by(full_name), transaction:transaction_id(id, property_address)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data as Array<{
    id: string
    name: string
    storage_path: string
    mime_type: string | null
    size_bytes: number | null
    folder: string | null
    created_at: string
    uploader: { full_name: string } | null
    transaction: { id: string; property_address: string } | null
  }>
}

export async function uploadFile(transactionId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const file = formData.get('file') as File
  const folder = (formData.get('folder') as string) || 'other'

  if (!file || file.size === 0) throw new Error('No file selected')
  if (file.size > MAX_BYTES) throw new Error('File too large (max 50 MB)')

  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const storagePath = `transactions/${transactionId}/${folder}/${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type })
  if (uploadError) throw new Error(uploadError.message)

  const { error: dbError } = await supabase.from('files').insert({
    name: file.name,
    storage_path: storagePath,
    mime_type: file.type,
    size_bytes: file.size,
    transaction_id: transactionId,
    folder,
    uploaded_by: user.id,
  })
  if (dbError) {
    await supabase.storage.from(BUCKET).remove([storagePath])
    throw new Error(dbError.message)
  }

  revalidatePath(`/transactions/${transactionId}`)
  revalidatePath('/files')
}

export async function deleteFile(fileId: string, storagePath: string, transactionId: string) {
  const supabase = await createClient()
  await supabase.storage.from(BUCKET).remove([storagePath])
  const { error } = await supabase.from('files').delete().eq('id', fileId)
  if (error) throw new Error(error.message)
  revalidatePath(`/transactions/${transactionId}`)
  revalidatePath('/files')
}

export async function getSignedUrl(storagePath: string): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600) // 1 hour
  if (error) throw new Error(error.message)
  return data.signedUrl
}

