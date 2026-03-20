'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { markAsRead, markAllAsRead } from '@/lib/actions/notifications'
import { formatDate } from '@/lib/utils/dates'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  read: boolean
  link: string | null
  created_at: string
}

interface Props {
  notifications: Notification[]
  unreadCount: number
}

export function NotificationBell({ notifications, unreadCount }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleRead(id: string, link: string | null) {
    await markAsRead(id)
    setOpen(false)
    if (link) router.push(link)
    router.refresh()
  }

  async function handleMarkAll() {
    await markAllAsRead()
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-10 z-20 w-80 rounded-lg border bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleRead(n.id, n.link)}
                    className={cn(
                      'w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors',
                      !n.read && 'bg-blue-50/50'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                      )}
                      <div className={cn(!n.read ? '' : 'pl-3.5')}>
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        {n.body && <p className="text-xs text-gray-500 line-clamp-1">{n.body}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(n.created_at)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
