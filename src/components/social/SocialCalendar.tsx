'use client'

import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import type { EventClickArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import { SocialPostForm } from './SocialPostForm'
import type { SocialPost, SocialPostStatus } from '@/lib/utils/social'
import { cn } from '@/lib/utils'

interface Props {
  posts: SocialPost[]
  transactions: { id: string; property_address: string }[]
}

const STATUS_COLORS: Record<SocialPostStatus, string> = {
  draft: '#9ca3af',
  scheduled: '#3b82f6',
  published: '#22c55e',
  cancelled: '#f87171',
}

export function SocialCalendar({ posts, transactions }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editPost, setEditPost] = useState<SocialPost | null>(null)
  const [defaultDate, setDefaultDate] = useState<string | null>(null)

  const events = posts.map((p) => ({
    id: p.id,
    title: p.title,
    date: p.scheduled_at
      ? p.scheduled_at.slice(0, 10)
      : p.created_at.slice(0, 10),
    backgroundColor: STATUS_COLORS[p.status],
    borderColor: STATUS_COLORS[p.status],
    extendedProps: { post: p },
  }))

  function handleDateClick(info: DateClickArg) {
    setEditPost(null)
    setDefaultDate(info.dateStr)
    setFormOpen(true)
  }

  function handleEventClick(info: EventClickArg) {
    setEditPost(info.event.extendedProps.post as SocialPost)
    setDefaultDate(null)
    setFormOpen(true)
  }

  return (
    <>
      <div className="rounded-lg border bg-white p-4 [&_.fc-toolbar-title]:text-base [&_.fc-toolbar-title]:font-semibold [&_.fc-button]:text-xs [&_.fc-button]:px-2.5 [&_.fc-button]:py-1 [&_.fc-button]:rounded-md [&_.fc-button-primary]:bg-gray-900 [&_.fc-button-primary]:border-gray-900 [&_.fc-event]:cursor-pointer [&_.fc-event]:text-xs [&_.fc-event]:px-1">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listMonth',
          }}
          buttonText={{
            today: 'Today',
            month: 'Month',
            listMonth: 'List',
          }}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          dayMaxEvents={3}
          eventDisplay="block"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 px-1">
        {([
          ['draft', 'Draft'],
          ['scheduled', 'Scheduled'],
          ['published', 'Published'],
          ['cancelled', 'Cancelled'],
        ] as [SocialPostStatus, string][]).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      <SocialPostForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditPost(null) }}
        editPost={editPost}
        defaultDate={defaultDate}
        transactions={transactions}
      />
    </>
  )
}
