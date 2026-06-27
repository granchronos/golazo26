'use client'

import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, X, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { BRACKET_ROUNDS } from '@/lib/constants/bracket'
import { KNOCKOUT_DEADLINES, KNOCKOUT_DEADLINE_LABELS } from '@/lib/constants/points'
import { getCountdown } from '@/lib/utils/date'

interface KnockoutDeadlineBannerProps {
  existingKnockoutPredictions: Record<number, string>
  isReadOnly?: boolean
}

interface RoundStatus {
  id: string
  label: string
  missingCount: number
  totalCount: number
  deadline: Date
  timeLabels: { date: string; spain: string; peru: string }
  urgency: 'high' | 'medium' | 'low'
  isOpen: boolean
}

export function KnockoutDeadlineBanner({
  existingKnockoutPredictions,
  isReadOnly = false,
}: KnockoutDeadlineBannerProps) {
  const [dismissedRounds, setDismissedRounds] = useState<Record<string, boolean>>({})
  const [now, setNow] = useState(new Date())

  // Load dismissed state from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('golazo_dismissed_banners')
      if (stored) {
        setDismissedRounds(JSON.parse(stored))
      }
    } catch (e) {
      // Ignore sessionStorage errors
    }

    // Tick every second to update 'now' for urgency and countdowns
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const handleDismiss = (roundId: string) => {
    const next = { ...dismissedRounds, [roundId]: true }
    setDismissedRounds(next)
    try {
      sessionStorage.setItem('golazo_dismissed_banners', JSON.stringify(next))
    } catch (e) {
      // Ignore
    }
  }

  // Calculate status for all rounds
  const statuses = useMemo(() => {
    if (isReadOnly) return []

    const currentNow = now.getTime()

    return BRACKET_ROUNDS.map((round): RoundStatus | null => {
      const deadline = KNOCKOUT_DEADLINES[round.id]
      if (!deadline) return null

      const isOpen = deadline.getTime() > currentNow
      if (!isOpen) return null // Don't show if closed

      if (dismissedRounds[round.id]) return null // User dismissed

      const pickedCount = round.matches.filter((m) => existingKnockoutPredictions[m.matchNumber]).length
      const totalCount = round.matches.length
      const missingCount = totalCount - pickedCount

      if (missingCount === 0) return null // All filled

      const msRemaining = deadline.getTime() - currentNow
      const hoursRemaining = msRemaining / (1000 * 60 * 60)

      let urgency: 'high' | 'medium' | 'low' = 'low'
      if (hoursRemaining < 24) urgency = 'high'
      else if (hoursRemaining < 72) urgency = 'medium'

      return {
        id: round.id,
        label: round.label,
        missingCount,
        totalCount,
        deadline,
        timeLabels: KNOCKOUT_DEADLINE_LABELS[round.id],
        urgency,
        isOpen,
      }
    }).filter(Boolean) as RoundStatus[]
  }, [existingKnockoutPredictions, isReadOnly, now, dismissedRounds])

  if (statuses.length === 0) return null

  // Group by urgency for styling the container (use highest urgency)
  const highestUrgency = statuses.some((s) => s.urgency === 'high')
    ? 'high'
    : statuses.some((s) => s.urgency === 'medium')
      ? 'medium'
      : 'low'

  const containerClasses = {
    high: 'border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5',
    medium: 'border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5',
    low: 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]',
  }

  const iconClasses = {
    high: 'text-red-500',
    medium: 'text-amber-500',
    low: 'text-gray-500 dark:text-gray-400',
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        className="mb-6 overflow-hidden"
      >
        <div className={cn('relative rounded-xl border p-4', containerClasses[highestUrgency])}>
          <div className="flex items-start gap-3">
            <div className={cn('mt-0.5', iconClasses[highestUrgency])}>
              <AlertTriangle size={18} className={highestUrgency === 'high' ? 'animate-pulse' : ''} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Tienes predicciones pendientes
              </h4>

              <div className="space-y-3">
                {statuses.map((status) => {
                  const countdown = getCountdown(status.deadline)
                  
                  return (
                    <div key={status.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 group relative">
                      {/* Close button for this specific round banner */}
                      <button
                        onClick={() => handleDismiss(status.id)}
                        className="absolute -right-2 -top-2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                        title="Ocultar aviso"
                      >
                        <X size={14} />
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            'text-xs font-bold uppercase tracking-wider',
                            status.urgency === 'high' ? 'text-red-600 dark:text-red-400' :
                            status.urgency === 'medium' ? 'text-amber-600 dark:text-amber-400' :
                            'text-gray-700 dark:text-gray-300'
                          )}>
                            {status.label}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Cierra {status.timeLabels.date} · 🇪🇸 {status.timeLabels.spain} · 🇵🇪 {status.timeLabels.peru}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          Te faltan <span className="font-semibold text-gray-900 dark:text-white">{status.missingCount}</span> de {status.totalCount} partidos
                        </p>
                      </div>

                      {/* Live Countdown */}
                      <div className="flex items-center gap-1.5 font-mono text-[11px] bg-white dark:bg-black/20 px-2 py-1 rounded-md border border-gray-100 dark:border-white/5 self-start sm:self-auto shrink-0">
                        <Clock size={12} className={status.urgency === 'high' ? 'text-red-500' : 'text-gray-400'} />
                        {countdown.days > 0 && <span>{countdown.days}d</span>}
                        <span>{String(countdown.hours).padStart(2, '0')}h</span>
                        <span>{String(countdown.minutes).padStart(2, '0')}m</span>
                        <span className={status.urgency === 'high' ? 'text-red-500 font-bold' : ''}>
                          {String(countdown.seconds).padStart(2, '0')}s
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
