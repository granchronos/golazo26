'use client'

import { cn } from '@/lib/utils/cn'
import { WC_HISTORY } from '@/lib/constants/teams'
import type { WCHistoryEntry } from '@/lib/constants/teams'

interface WCBadgeProps {
  teamId: string
  size?: 'xs' | 'sm'
  className?: string
}

const BEST_LABELS: Record<string, string> = {
  Final: 'Final',
  Semi: 'Semi',
  Cuartos: '4tos',
  Octavos: '8vos',
  Grupos: 'Grupos',
  Debut: 'Debut',
}

export function WCBadge({ teamId, size = 'xs', className }: WCBadgeProps) {
  const h = WC_HISTORY[teamId]
  if (!h) return null

  const text = size === 'sm' ? 'text-[9px]' : 'text-[7px]'

  if (h.titles > 0) {
    return (
      <span className={cn(text, 'font-bold text-[#C9A84C] leading-none whitespace-nowrap', className)}>
        {'★'.repeat(Math.min(h.titles, 5))}
      </span>
    )
  }

  if (!h.best) return null

  return (
    <span
      className={cn(
        text,
        'font-mono leading-none whitespace-nowrap',
        h.best === 'Final'
          ? 'text-blue-400'
          : h.best === 'Semi'
            ? 'text-emerald-400'
            : h.best === 'Debut'
              ? 'text-purple-400'
              : 'text-gray-400 dark:text-gray-500',
        className
      )}
    >
      {BEST_LABELS[h.best]}
    </span>
  )
}

export function WCBadgeInline({ teamId, className }: { teamId: string; className?: string }) {
  const h = WC_HISTORY[teamId]
  if (!h) return null

  if (h.titles > 0) {
    return (
      <span className={cn('text-[8px] font-bold text-[#C9A84C] leading-none', className)}>
        ★{h.titles}
      </span>
    )
  }

  if (!h.best) return null

  return (
    <span
      className={cn(
        'text-[8px] font-mono leading-none',
        h.best === 'Final'
          ? 'text-blue-400'
          : h.best === 'Semi'
            ? 'text-emerald-400'
            : h.best === 'Debut'
              ? 'text-purple-400'
              : 'text-gray-400 dark:text-gray-500',
        className
      )}
    >
      {BEST_LABELS[h.best]}
    </span>
  )
}
