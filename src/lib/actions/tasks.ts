'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TaskStatus } from '@/types'

export async function getTasks(filter?: 'mine' | 'all' | 'review') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!assigned_to(id, full_name),
      assigner:profiles!assigned_by(id, full_name),
      reviewer:profiles!review_requested_from(id, full_name),
      transaction:transactions(id, property_address, type)
    `)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (filter === 'mine') {
    query = query.eq('assigned_to', user?.id)
  } else if (filter === 'review') {
    query = query.eq('review_requested_from', user?.id)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function getTask(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!assigned_to(id, full_name),
      assigner:profiles!assigned_by(id, full_name),
      reviewer:profiles!review_requested_from(id, full_name),
      transaction:transactions(id, property_address, type)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createTask(formData: {
  title: string
  description?: string
  assigned_to: string
  transaction_id?: string
  due_date?: string
  follow_up_date?: string
  review_requested_from?: string
  is_auto_assigned?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: task, error } = await supabase.from('tasks').insert({
    ...formData,
    assigned_by: user?.id,
    status: 'pending',
  }).select().single()

  if (error) throw new Error(error.message)

  // Create notification for assignee if different from creator
  if (formData.assigned_to !== user?.id) {
    await supabase.from('notifications').insert({
      user_id: formData.assigned_to,
      type: 'task_assigned',
      title: 'New task assigned to you',
      body: formData.title,
      link: `/tasks/${task.id}`,
    })
  }

  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  return task
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/tasks')
  revalidatePath('/dashboard')
}

export async function updateTask(
  id: string,
  formData: {
    title?: string
    description?: string
    assigned_to?: string
    due_date?: string | null
    follow_up_date?: string | null
    review_requested_from?: string | null
    status?: TaskStatus
  }
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tasks')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  // Notify reviewer if review was requested
  if (formData.review_requested_from) {
    const { data: task } = await supabase.from('tasks').select('title').eq('id', id).single()
    await supabase.from('notifications').insert({
      user_id: formData.review_requested_from,
      type: 'review_requested',
      title: 'Review requested on a task',
      body: task?.title,
      link: `/tasks/${id}`,
    })
  }

  revalidatePath('/tasks')
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/tasks')
}
