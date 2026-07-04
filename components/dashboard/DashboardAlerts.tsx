'use client'

import { useState, useMemo } from 'react'
import { AlertTriangle, Info, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { BRACKET_ROUNDS } from '@/lib/constants/bracket'
import { ROUND_DEADLINES } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'

interface DashboardAlertsProps {
  roomId: string
  roomName: string
  existingKnockoutPredictions: Record<number, string>
  scorePredictions: Record<number, { home: number; away: number } | { home: number | null; away: number | null }>
  matches: Array<{ match_number: number; match_date: string; round: string; status: string; home_team_id: string | null; away_team_id: string | null }>
}

export function DashboardAlerts({
  roomId,
  roomName,
  existingKnockoutPredictions,
  scorePredictions,
  matches,
}: DashboardAlertsProps) {
  const [dismissed, setDismissed] = useState(false)
  const now = Date.now()

  const alerts = useMemo(() => {
    const result: Array<{ roundId: string; label: string; missing: number; urgency: 'critical' | 'warning' | 'info' }> = []

    for (const round of BRACKET_ROUNDS) {
      // Only show from quarter-finals onwards
      if (round.id === 'round_of_32' || round.id === 'round_of_16') continue

      const deadline = ROUND_DEADLINES[round.id]
      if (!deadline) continue
      const deadlineMs = deadline.getTime()

      // Show if within 7 days or past deadline with missing picks (no expiry limit)
      if (deadlineMs > now + 7 * 24 * 60 * 60 * 1000) continue

      // Only count matches whose teams are confirmed (not TBD)
      const roundMatchNumbers = new Set(round.matches.map(m => m.matchNumber))
      const confirmedMatches = matches.filter(
        m => roundMatchNumbers.has(m.match_number) && m.home_team_id && m.away_team_id
      )
      const confirmedNumbers = new Set(confirmedMatches.map(m => m.match_number))

      // Count missing bracket picks (only for confirmed matches)
      const bracketMatchNumbers = round.matches
        .filter(m => confirmedNumbers.has(m.matchNumber))
        .map(m => m.matchNumber)
      const missingBracket = bracketMatchNumbers.filter(
        mn => !existingKnockoutPredictions[mn]
      ).length

      // Count missing score predictions (only for confirmed matches)
      const missingScores = confirmedMatches
        .filter(m => m.status !== 'finished')
        .filter(m => {
          const pred = scorePredictions[m.match_number]
          return !pred || pred.home == null || pred.away == null
        }).length

      const missing = missingBracket + missingScores
      if (missing === 0) continue

      const diff = deadlineMs - now
      let urgency: 'critical' | 'warning' | 'info' = 'info'
      if (diff < 0) urgency = 'critical'
      else if (diff < 60 * 60 * 1000) urgency = 'critical'
      else if (diff < 6 * 60 * 60 * 1000) urgency = 'warning'

      result.push({ roundId: round.id, label: round.label, missing, urgency })
    }

    return result
  }, [existingKnockoutPredictions, scorePredictions, matches, now])

  if (alerts.length === 0 || dismissed) return null

  const criticalCount = alerts.filter(a => a.urgency === 'critical').length
  const totalMissing = alerts.reduce((sum, a) => sum + a.missing, 0)

  return (
    <Link href={`/groups/${roomId}`} className="block">
      <div className={cn(
        'glass-card px-3 sm:px-4 py-3 flex items-center gap-3 hover:border-gray-300 dark:hover:border-white/20 transition-colors group',
        criticalCount > 0
          ? 'border-l-4 border-l-red-500'
          : 'border-l-4 border-l-amber-400'
      )}>
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          criticalCount > 0
            ? 'bg-red-100 dark:bg-red-900/30'
            : 'bg-amber-100 dark:bg-amber-900/30'
        )}>
          {criticalCount > 0
            ? <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
            : <Info size={16} className="text-amber-600 dark:text-amber-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-body font-semibold dark:text-white truncate">
            {roomName}
          </p>
          <p className={cn(
            'text-xs font-body',
            criticalCount > 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-amber-600 dark:text-amber-400'
          )}>
            {totalMissing} predicciones pendientes
            {criticalCount > 0 && ` · ${criticalCount} ronda(s) urgente(s)`}
          </p>
        </div>
        <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" />
      </div>
    </Link>
  )
}
