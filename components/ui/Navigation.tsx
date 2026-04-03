'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Home,
  Calendar,
  Users,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { logout } from '@/app/actions/auth'
import type { Profile } from '@/types/database'

const NAV_ITEMS = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/fixture', label: 'Fixture', icon: Calendar },
  { href: '/groups', label: 'Salas', icon: Users },
]

interface NavigationProps {
  profile: Profile | null
  hasRooms?: boolean
}

export function MobileNav({ profile, hasRooms = true }: NavigationProps) {
  const pathname = usePathname()
  const items = hasRooms ? NAV_ITEMS : NAV_ITEMS.filter((i) => i.href === '/' || i.href === '/groups')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden">
      <div className="mx-2 mb-2">
        <div className="bg-white/95 dark:bg-[#111118]/95 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl">
          <div className="flex items-center justify-around px-1 py-1.5">
            {items.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[48px]',
                    isActive
                      ? 'text-[#2A398D] dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-active"
                      className="absolute inset-0 bg-[#2A398D]/8 dark:bg-[#2A398D]/15 rounded-xl"
                    />
                  )}
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} className="relative z-10" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

const SIDEBAR_KEY = 'golazo26_sidebar_collapsed'

export function Sidebar({ profile, hasRooms = true }: NavigationProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const sidebarItems = hasRooms ? NAV_ITEMS : NAV_ITEMS.filter((i) => i.href === '/' || i.href === '/groups')

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY)
    if (stored === 'true') setCollapsed(true)
  }, [])

  const toggle = () => {
    setCollapsed((v) => {
      const next = !v
      localStorage.setItem(SIDEBAR_KEY, String(next))
      window.dispatchEvent(new Event('sidebar-toggle'))
      return next
    })
  }

  return (
    <aside
      className={cn(
        'hidden sm:flex flex-col fixed left-0 top-0 h-screen bg-white dark:bg-[#0a0a0f] border-r border-gray-100 dark:border-white/[0.06] z-30 transition-all duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'border-b border-gray-100 dark:border-white/[0.06]',
        collapsed ? 'px-0 py-4 flex flex-col items-center gap-2' : 'px-3 py-5 flex items-center justify-between'
      )}>
        <Link href="/" className={cn(
          'flex items-center overflow-hidden',
          collapsed ? 'justify-center' : 'gap-2.5'
        )}>
          <div className="w-9 h-9 rounded-lg bg-[#2A398D] flex items-center justify-center flex-shrink-0">
            <span className="font-display text-white text-base">26</span>
          </div>
          {!collapsed && <span className="font-display text-lg text-gray-900 dark:text-white whitespace-nowrap">Golazo</span>}
        </Link>
        <button onClick={toggle} className={cn(
          'p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors flex-shrink-0',
          collapsed && 'mt-0.5'
        )}>
          {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'relative flex items-center gap-2.5 rounded-xl font-body text-[13px] transition-colors',
                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
                isActive
                  ? 'text-[#2A398D] dark:text-blue-400 font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.04]'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-[#2A398D]/[0.06] dark:bg-[#2A398D]/15 rounded-xl"
                />
              )}
              <Icon size={16} strokeWidth={isActive ? 2.5 : 1.5} className="relative z-10 flex-shrink-0" />
              {!collapsed && <span className="relative z-10">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User & Logout */}
      <div className="px-2 py-4 border-t border-gray-100 dark:border-white/[0.06] space-y-2">
        {profile && !collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-1">
            <div className="w-7 h-7 rounded-full bg-[#2A398D] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold font-body">
                {profile.name?.[0]?.toUpperCase()}
              </span>
            </div>
            <p className="text-[13px] font-body font-medium truncate dark:text-white">{profile.name}</p>
          </div>
        )}
        {profile && collapsed && (
          <div className="flex justify-center py-1">
            <div className="w-7 h-7 rounded-full bg-[#2A398D] flex items-center justify-center">
              <span className="text-white text-xs font-semibold font-body">
                {profile.name?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>
        )}
        <form action={logout}>
          <button
            type="submit"
            title={collapsed ? 'Cerrar sesión' : undefined}
            className={cn(
              'w-full flex items-center gap-2.5 py-2 rounded-xl text-[13px] font-body text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors',
              collapsed ? 'justify-center px-0' : 'px-3'
            )}
          >
            <LogOut size={14} />
            {!collapsed && 'Cerrar sesión'}
          </button>
        </form>
      </div>
    </aside>
  )
}

export function useSidebarWidth() {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    const check = () => setCollapsed(localStorage.getItem(SIDEBAR_KEY) === 'true')
    check()
    window.addEventListener('storage', check)
    window.addEventListener('sidebar-toggle', check)
    return () => {
      window.removeEventListener('storage', check)
      window.removeEventListener('sidebar-toggle', check)
    }
  }, [])
  // Return consistent default before mount to avoid hydration mismatch
  if (!mounted) return 'sm:pl-56'
  return collapsed ? 'sm:pl-16' : 'sm:pl-56'
}
