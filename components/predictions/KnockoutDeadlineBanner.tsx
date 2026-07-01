'use client'

import { useState, useEffect, useMemo } from 'react'
import { Info, X, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { BRACKET_ROUNDS } from '@/lib/constants/bracket'
import { getCountdown, ROUND_DEADLINES } from '@/lib/utils/date'

const ROUND_START_LABELS: Record<string, { date: string; spain: string; peru: string }> = {
  round_of_32:    { date: '28 Jun', spain: '20:55h', peru: '13:55h' },
  round_of_16:    { date: '4 Jul',  spain: '18:55h', peru: '11:55h' },
  quarter_finals: { date: '9 Jul',  spain: '21:55h', peru: '14:55h' },
  semi_finals:    { date: '14 Jul', spain: '20:55h', peru: '13:55h' },
  final:          { date: '19 Jul', spain: '20:55h', peru: '13:55h' },
}

interface KnockoutDeadlineBannerProps {
  existingKnockoutPredictions: Record<number, string>
  isReadOnly?: boolean
}

interface RoundStatus {
  id: string
  label: string
  missingCount: number
  totalCount: number
  startDate: Date
  timeLabels: { date: string; spain: string; peru: string }
}

export function KnockoutDeadlineBanner({
  existingKnockoutPredictions,
  isReadOnly = false,
}: KnockoutDeadlineBannerProps) {
  const [dismissedRounds, setDismissedRounds] = useState<Record<string, boolean>>({})
  const [now, setNow] = useState(new Date())

  // Load dismissed state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('golazo_info_banners')
      if (stored) {
        setDismissedRounds(JSON.parse(stored))
      }
    } catch (e) {
      // Ignore localStorage errors
    }

    // Tick every second to update 'now' for urgency and countdowns
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const handleDismiss = (roundId: string) => {
    const next = { ...dismissedRounds, [roundId]: true }
    setDismissedRounds(next)
    try {
      localStorage.setItem('golazo_info_banners', JSON.stringify(next))
    } catch (e) {
      // Ignore
    }
  }

  // Calculate status for all rounds
  const statuses = useMemo(() => {
    if (isReadOnly) return []

    const currentNow = now.getTime()

    return BRACKET_ROUNDS.map((round): RoundStatus | null => {
      const startDate = ROUND_DEADLINES[round.id]
      if (!startDate) return null

      const isUpcoming = startDate.getTime() > currentNow
      if (!isUpcoming) return null // Don't show if the round already started

      if (dismissedRounds[round.id]) return null // User dismissed

      const pickedCount = round.matches.filter((m) => existingKnockoutPredictions[m.matchNumber]).length
      const totalCount = round.matches.length
      const missingCount = totalCount - pickedCount

      if (missingCount === 0) return null // All filled

      return {
        id: round.id,
        label: round.label,
        missingCount,
        totalCount,
        startDate,
        timeLabels: ROUND_START_LABELS[round.id],
      }
    }).filter(Boolean) as RoundStatus[]
  }, [existingKnockoutPredictions, isReadOnly, now, dismissedRounds])

  if (statuses.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -5, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -5, height: 0 }}
        className="mb-4 overflow-hidden"
      >
        <div className="relative rounded-xl border border-blue-200/50 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5 p-3">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 text-blue-500 dark:text-blue-400">
              <Info size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="space-y-2">
                {statuses.map((status) => {
                  const countdown = getCountdown(status.startDate)
                  
                  return (
                    <div key={status.id} className="flex flex-col gap-2 group relative border-b border-blue-100/50 dark:border-blue-500/10 pb-2 last:border-0 last:pb-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap pr-4">
                            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                              {status.label}
                            </span>
                            <span className="text-[11px] text-blue-600/80 dark:text-blue-400/80">
                              Inicia el {status.timeLabels.date} · 🇪🇸 {status.timeLabels.spain} · 🇵🇪 {status.timeLabels.peru}
                            </span>
                          </div>
                          <p className="text-[11px] text-blue-700/70 dark:text-blue-300/70 mt-0.5">
                            Te faltan {status.missingCount} de {status.totalCount} predicciones
                          </p>
                        </div>

                        {/* Live Countdown */}
                        <div className="flex items-center gap-1.5 font-mono text-[10px] bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md self-start shrink-0 text-blue-700 dark:text-blue-300">
                          <Clock size={10} />
                          {countdown.days > 0 && <span>{countdown.days}d</span>}
                          <span>{String(countdown.hours).padStart(2, '0')}h</span>
                          <span>{String(countdown.minutes).padStart(2, '0')}m</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end mt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer group/chk">
                          <input 
                            type="checkbox" 
                            className="w-3 h-3 rounded border-blue-300 text-blue-600 focus:ring-blue-500/20 bg-white/50 cursor-pointer"
                            onChange={(e) => {
                              if (e.target.checked) handleDismiss(status.id)
                            }}
                          />
                          <span className="text-[10px] text-blue-700/60 group-hover/chk:text-blue-700/90 dark:text-blue-300/50 dark:group-hover/chk:text-blue-300/80 transition-colors">
                            No volver a mostrar
                          </span>
                        </label>
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
