import { Sidebar } from '@/components/layout/Sidebar'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { getNotifications, getUnreadCount } from '@/lib/actions/notifications'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user?.id)
    .single()

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(),
    getUnreadCount(),
  ])

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-stone-200 bg-white px-6">
          <span className="text-sm text-slate-500">
            Welcome back, <span className="font-semibold text-slate-900">{profile?.full_name}</span>
          </span>
          <NotificationBell notifications={notifications} unreadCount={unreadCount} />
        </header>
        <main className="flex-1 overflow-y-auto bg-stone-50">
          {children}
        </main>
      </div>
    </div>
  )
}
