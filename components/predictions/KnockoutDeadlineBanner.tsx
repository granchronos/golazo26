'use client'

import { useState, useEffect, useMemo } from 'react'
import { Info, Clock } from 'lucide-react'
import { BRACKET_ROUNDS } from '@/lib/constants/bracket'
import { getCountdown, ROUND_DEADLINES } from '@/lib/utils/date'
import { Modal } from '@/components/ui/Modal'

const ROUND_START_LABELS: Record<string, { date: string; spain: string; peru: string }> = {
  round_of_32:    { date: '28 Jun', spain: '20:55h', peru: '13:55h' },
  round_of_16:    { date: '4 Jul',  spain: '18:55h', peru: '11:55h' },
  quarter_finals: { date: '9 Jul',  spain: '21:55h', peru: '14:55h' },
  semi_finals:    { date: '14 Jul', spain: '20:55h', peru: '13:55h' },
  final:          { date: '19 Jul', spain: '20:55h', peru: '13:55h' },
}

interface KnockoutDeadlineBannerProps {
  existingKnockoutPredictions: Record<number, string>
  scorePredictions: Record<number, { home: number; away: number } | { home: number | null; away: number | null }>
  upcomingMatches: Array<{ match_number: number; match_date: string; home_team_id: string | null; away_team_id: string | null; round: string }>
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
  scorePredictions,
  upcomingMatches,
  isReadOnly = false,
}: KnockoutDeadlineBannerProps) {
  const [dismissedRounds, setDismissedRounds] = useState<Record<string, boolean>>({})
  const [now, setNow] = useState(new Date())
  const [isTemporarilyClosed, setIsTemporarilyClosed] = useState(false)

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
    if (isReadOnly || isTemporarilyClosed) return []

    const currentNow = now.getTime()

    return BRACKET_ROUNDS.map((round): RoundStatus | null => {
      const startDate = ROUND_DEADLINES[round.id]
      if (!startDate) return null

      const isUpcoming = startDate.getTime() > currentNow
      if (!isUpcoming) return null // Don't show if the round already started

      if (dismissedRounds[round.id]) return null // User dismissed

      // Count missing bracket picks
      const pickedCount = round.matches.filter((m) => existingKnockoutPredictions[m.matchNumber]).length
      const totalCount = round.matches.length
      const missingBracket = totalCount - pickedCount

      // Count missing score predictions for upcoming matches in this round
      const roundMatchNumbers = new Set(round.matches.map(m => m.matchNumber))
      const upcomingRoundMatches = upcomingMatches.filter(
        m => roundMatchNumbers.has(m.match_number) && new Date(m.match_date).getTime() > currentNow
      )
      const missingScores = upcomingRoundMatches.filter(m => {
        const pred = scorePredictions[m.match_number]
        return !pred || pred.home == null || pred.away == null
      }).length

      const missingCount = missingBracket + missingScores
      if (missingCount === 0) return null // All filled

      return {
        id: round.id,
        label: round.label,
        missingCount,
        totalCount: totalCount + upcomingRoundMatches.length,
        startDate,
        timeLabels: ROUND_START_LABELS[round.id],
      }
    }).filter(Boolean) as RoundStatus[]
  }, [existingKnockoutPredictions, scorePredictions, upcomingMatches, isReadOnly, now, dismissedRounds, isTemporarilyClosed])

  if (statuses.length === 0) return null

  return (
    <Modal open={statuses.length > 0} onClose={() => setIsTemporarilyClosed(true)} title="Aviso Importante" size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 p-3 rounded-lg border border-blue-100 dark:border-blue-500/20">
          <Info size={20} className="shrink-0" />
          <p className="text-sm font-medium">
            Tienes predicciones pendientes para las próximas fases. ¡No olvides poner el marcador de cada partido!
          </p>
        </div>

        <div className="space-y-3">
          {statuses.map((status) => {
            const countdown = getCountdown(status.startDate)
            
            return (
              <div key={status.id} className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-1">
                      {status.label}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                      Inicia el {status.timeLabels.date} · 🇪🇸 {status.timeLabels.spain} · 🇵🇪 {status.timeLabels.peru}
                    </p>
                    <p className="text-xs font-semibold text-red-500 dark:text-red-400">
                      Te faltan {status.missingCount} de {status.totalCount} predicciones
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-xs bg-white dark:bg-black/20 px-2.5 py-1 rounded-md self-start shrink-0 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                    <Clock size={12} className="text-[#E61D25] dark:text-red-500" />
                    {countdown.days > 0 && <span>{countdown.days}d</span>}
                    <span>{String(countdown.hours).padStart(2, '0')}h</span>
                    <span>{String(countdown.minutes).padStart(2, '0')}m</span>
                  </div>
                </div>

                <div className="flex items-center justify-end mt-1 border-t border-gray-200 dark:border-white/10 pt-3">
                  <label className="flex items-center gap-2 cursor-pointer group/chk">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-[#2A398D] focus:ring-[#2A398D]/20 cursor-pointer"
                      onChange={(e) => {
                        if (e.target.checked) handleDismiss(status.id)
                      }}
                    />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover/chk:text-gray-900 dark:group-hover/chk:text-gray-200 transition-colors">
                      Entendido, no volver a mostrar
                    </span>
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
