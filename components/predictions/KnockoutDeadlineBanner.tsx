'use client'

import { useState, useEffect, useMemo } from 'react'
import { Info, Clock, AlertTriangle } from 'lucide-react'
import { BRACKET_ROUNDS } from '@/lib/constants/bracket'
import { getCountdown, ROUND_DEADLINES } from '@/lib/utils/date'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils/cn'

const ROUND_START_LABELS: Record<string, { date: string; spain: string; peru: string }> = {
  round_of_32:    { date: '28 Jun', spain: '20:55h', peru: '13:55h' },
  round_of_16:    { date: '4 Jul',  spain: '18:55h', peru: '11:55h' },
  quarter_finals: { date: '9 Jul',  spain: '21:55h', peru: '14:55h' },
  semi_finals:    { date: '14 Jul', spain: '20:55h', peru: '13:55h' },
  third_place:    { date: '18 Jul', spain: '18:55h', peru: '11:55h' },
  final:          { date: '19 Jul', spain: '20:55h', peru: '13:55h' },
}

interface KnockoutDeadlineBannerProps {
  existingKnockoutPredictions: Record<number, string>
  scorePredictions: Record<number, { home: number; away: number } | { home: number | null; away: number | null }>
  upcomingMatches: Array<{ match_number: number; match_date: string; home_team_id: string | null; away_team_id: string | null; round: string }>
  isReadOnly?: boolean
  variant?: 'modal' | 'compact'
}

interface RoundStatus {
  id: string
  label: string
  missingBracket: number
  missingScores: number
  totalCount: number
  startDate: Date
  timeLabels: { date: string; spain: string; peru: string }
  missingMatches: Array<{ matchNumber: number; matchDate: string; type: 'bracket' | 'score' }>
}

function getUrgency(deadlineMs: number, nowMs: number): 'critical' | 'warning' | 'info' {
  const diff = deadlineMs - nowMs
  if (diff <= 0) return 'critical'
  if (diff < 60 * 60 * 1000) return 'critical'      // < 1h
  if (diff < 6 * 60 * 60 * 1000) return 'warning'     // < 6h
  return 'info'
}

function formatMatchTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function KnockoutDeadlineBanner({
  existingKnockoutPredictions,
  scorePredictions,
  upcomingMatches,
  isReadOnly = false,
  variant = 'modal',
}: KnockoutDeadlineBannerProps) {
  const [isTemporarilyClosed, setIsTemporarilyClosed] = useState(false)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(interval)
  }, [])

  const statuses = useMemo(() => {
    if (isReadOnly) return []

    const currentNow = now.getTime()

    return BRACKET_ROUNDS.map((round) => {
      const startDate = ROUND_DEADLINES[round.id]
      if (!startDate) return null

      const deadlineMs = startDate.getTime()
      const isFuture = deadlineMs > currentNow
      // Show if upcoming OR if it passed within the last 24h (urgent)
      const isRecentlyExpired = deadlineMs <= currentNow && currentNow - deadlineMs < 24 * 60 * 60 * 1000
      if (!isFuture && !isRecentlyExpired) return null

      // Count missing bracket picks
      const pickedCount = round.matches.filter((m) => existingKnockoutPredictions[m.matchNumber]).length
      const totalCount = round.matches.length
      const missingBracket = totalCount - pickedCount

      // Count missing score predictions
      const roundMatchNumbers = new Set(round.matches.map(m => m.matchNumber))
      const upcomingRoundMatches = upcomingMatches.filter(
        m => roundMatchNumbers.has(m.match_number)
      )
      const missingScores = upcomingRoundMatches.filter(m => {
        const pred = scorePredictions[m.match_number]
        return !pred || pred.home == null || pred.away == null
      }).length

      // Build detailed missing match list
      const missingMatches: RoundStatus['missingMatches'] = []
      for (const m of round.matches) {
        const bracketMissing = !existingKnockoutPredictions[m.matchNumber]
        if (bracketMissing) {
          missingMatches.push({ matchNumber: m.matchNumber, matchDate: m.matchDate, type: 'bracket' })
        }
      }
      for (const m of upcomingRoundMatches) {
        const pred = scorePredictions[m.match_number]
        const scoreMissing = !pred || pred.home == null || pred.away == null
        if (scoreMissing) {
          if (!missingMatches.some(x => x.matchNumber === m.match_number && x.type === 'score')) {
            missingMatches.push({ matchNumber: m.match_number, matchDate: m.match_date, type: 'score' })
          }
        }
      }

      const totalMissing = missingBracket + missingScores
      if (totalMissing === 0) return null

      return {
        id: round.id,
        label: round.label,
        missingBracket,
        missingScores,
        totalCount: totalCount + upcomingRoundMatches.length,
        startDate,
        timeLabels: ROUND_START_LABELS[round.id],
        missingMatches,
      }
    }).filter(Boolean) as RoundStatus[]
  }, [existingKnockoutPredictions, scorePredictions, upcomingMatches, isReadOnly, now])

  // Compact variant: just show a single-line banner
  if (variant === 'compact') {
    if (statuses.length === 0 || isTemporarilyClosed) return null
    const totalMissing = statuses.reduce((sum, s) => sum + s.missingBracket + s.missingScores, 0)
    const criticalCount = statuses.filter(s => getUrgency(s.startDate.getTime(), now.getTime()) === 'critical').length

    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-body cursor-pointer hover:opacity-90 transition-opacity',
        criticalCount > 0
          ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/30'
          : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/30'
      )}
        onClick={() => setIsTemporarilyClosed(true)}
        title="Click para cerrar"
      >
        {criticalCount > 0 ? <AlertTriangle size={14} /> : <Info size={14} />}
        <span className="font-semibold">{totalMissing} predicciones pendientes</span>
        {criticalCount > 0 && <span className="text-[10px] font-bold uppercase">· Urgente</span>}
      </div>
    )
  }

  if (statuses.length === 0 || isTemporarilyClosed) return null

  const totalMissing = statuses.reduce((sum, s) => sum + s.missingBracket + s.missingScores, 0)
  const criticalExists = statuses.some(s => getUrgency(s.startDate.getTime(), now.getTime()) === 'critical')

  return (
    <Modal open={statuses.length > 0} onClose={() => setIsTemporarilyClosed(true)} title="Aviso Importante" size="md">
      <div className="space-y-4">
        <div className={cn(
          'flex items-center gap-2 p-3 rounded-lg border',
          criticalExists
            ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20'
            : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20'
        )}>
          {criticalExists ? <AlertTriangle size={20} className="shrink-0" /> : <Info size={20} className="shrink-0" />}
          <p className="text-sm font-medium">
            Tienes <strong>{totalMissing} predicciones pendientes</strong>
            {criticalExists ? ' — algunas rondas cierran pronto!' : ' para las próximas fases.'}
          </p>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {statuses.map((status) => {
            const countdown = getCountdown(status.startDate)
            const urgency = getUrgency(status.startDate.getTime(), now.getTime())
            const isExpired = countdown.expired

            return (
              <div key={status.id} className={cn(
                'flex flex-col gap-2 p-4 rounded-xl border',
                urgency === 'critical'
                  ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30'
                  : urgency === 'warning'
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30'
                    : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10'
              )}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                        {status.label}
                      </h4>
                      {isExpired && (
                        <span className="text-[9px] font-bold text-red-500 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">
                          VENCIDO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                      Inicia el {status.timeLabels.date} · 🇪🇸 {status.timeLabels.spain} · 🇵🇪 {status.timeLabels.peru}
                    </p>
                    <p className={cn(
                      'text-xs font-semibold',
                      urgency === 'critical' ? 'text-red-600 dark:text-red-400' :
                      urgency === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                      'text-gray-500 dark:text-gray-400'
                    )}>
                      {status.missingBracket > 0 && `${status.missingBracket} bracket(s) · `}
                      {status.missingScores > 0 && `${status.missingScores} marcador(es) · `}
                      {status.totalCount - status.missingBracket - status.missingScores} completas
                    </p>

                    {/* Match-level detail */}
                    {status.missingMatches.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {status.missingMatches.slice(0, 5).map((m) => (
                          <div key={`${m.matchNumber}-${m.type}`} className="flex items-center gap-1.5 text-[10px] font-mono">
                            <span className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              m.type === 'bracket' ? 'bg-[#2A398D]' : 'bg-[#C9A84C]'
                            )} />
                            <span className="text-gray-500">P{m.matchNumber}:</span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {m.type === 'bracket' ? 'Falta pick' : 'Falta marcador'}
                            </span>
                            <span className="text-gray-400 ml-auto">{formatMatchTime(m.matchDate)}</span>
                          </div>
                        ))}
                        {status.missingMatches.length > 5 && (
                          <p className="text-[10px] text-gray-400 pl-3">
                            ...y {status.missingMatches.length - 5} más
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={cn(
                    'flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-md self-start shrink-0 border',
                    urgency === 'critical'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/30'
                      : urgency === 'warning'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/30'
                        : 'bg-white dark:bg-black/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10'
                  )}>
                    <Clock size={12} className={urgency === 'critical' ? 'text-red-500' : urgency === 'warning' ? 'text-amber-500' : ''} />
                    {countdown.days > 0 && <span>{countdown.days}d</span>}
                    <span>{String(countdown.hours).padStart(2, '0')}h</span>
                    <span>{String(countdown.minutes).padStart(2, '0')}m</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-white/10">
          <p className="text-[10px] text-gray-400 font-body">
            El banner reaparecerá automáticamente si quedan picks pendientes
          </p>
          <button
            onClick={() => setIsTemporarilyClosed(true)}
            className="px-4 py-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-xs font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  )
}
