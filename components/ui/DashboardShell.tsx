'use client'

import { useSidebarWidth } from './Navigation'
import { cn } from '@/lib/utils/cn'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const sidebarPl = useSidebarWidth()

  return (
    <main className={cn('pb-20 sm:pb-8 min-h-screen transition-all duration-200', sidebarPl)}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </div>
    </main>
  )
}
