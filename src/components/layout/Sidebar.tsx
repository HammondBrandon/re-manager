'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowLeftRight,
  CheckSquare,
  Users,
  FolderOpen,
  Instagram,
  LogOut,
  Upload,
  Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/crm', label: 'CRM', icon: Users },
  { href: '/files', label: 'Files', icon: FolderOpen },
  { href: '/social', label: 'Social Media', icon: Instagram },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex h-full w-60 flex-col bg-[#1c2030]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500">
          <Home className="h-4 w-4 text-amber-950" />
        </div>
        <span className="text-base font-semibold tracking-tight text-white">
          RE <span className="text-amber-400">Manager</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
              pathname.startsWith(href)
                ? 'bg-amber-500/10 text-amber-400'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Import Data */}
      <div className="border-t border-white/10 p-3">
        <Link
          href="/import"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
            pathname.startsWith('/import')
              ? 'bg-amber-500/10 text-amber-400'
              : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
          )}
        >
          <Upload className="h-4 w-4 shrink-0" />
          Import Data
        </Link>
      </div>

      {/* Sign out */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-all duration-150 hover:bg-white/5 hover:text-slate-300"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
