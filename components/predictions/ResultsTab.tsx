'use client'

import { useState, useMemo, useTransition, useEffect, useRef, useCallback } from 'react'
import { Check, X, Clock, Loader2, Award, Edit, Info } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import { TeamFlag } from '@/components/ui/TeamFlag'
import { TEAMS } from '@/lib/constants/teams'
import { ROUND_LABELS, calculateMatchPoints, SIGN_POINTS, TEAM_BET_POINTS } from '@/lib/constants/points'
import { ALL_BRACKET_MATCHES } from '@/lib/constants/bracket'
import { formatShortDate, formatMatchDate } from '@/lib/utils/date'
import { LocalTime } from '@/components/ui/LocalTime'
import {
  saveMatchScorePrediction,
  saveMatchResult,
  saveActualGoleador,
} from '@/app/actions/predictions'
import type { Match, GroupLetter, GroupPrediction } from '@/types/database'
import type { TeamData } from '@/lib/constants/teams'

const TEAMS_BY_ID: Record<string, TeamData> = Object.fromEntries(TEAMS.map((t) => [t.id, t]))

export interface ScorePrediction {
  matchNumber: number
  homeScore: number
  awayScore: number
}

interface MemberPredictions {
  userId: string
  name: string
  groupPredictions: Record<GroupLetter, GroupPrediction | null>
  knockoutPredictions: Record<number, string>
  scorePredictions: Record<number, { home: number; away: number }>
}

interface ResultsTabProps {
  roomId: string
  matches: Match[]
  groupPredictions: Record<GroupLetter, GroupPrediction | null>
  knockoutPredictions: Record<number, string>
  scorePredictions: Record<number, { home: number; away: number }>
  allMembersPredictions?: MemberPredictions[]
  isAdmin?: boolean
  actualGoleador?: string | null
}

export function ResultsTab({
  roomId,
  matches,
  groupPredictions,
  knockoutPredictions,
  scorePredictions,
  allMembersPredictions = [],
  isAdmin = false,
  actualGoleador = null,
}: ResultsTabProps) {
  const [actualGoleadorText, setActualGoleadorText] = useState(actualGoleador || '')
  const [isGoleadorSaving, startGoleadorSaving] = useTransition()
  const [showRules, setShowRules] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActualGoleadorText(actualGoleador || '')
  }, [actualGoleador])

  // Auto-scroll to live match or last finished match
  useEffect(() => {
    if (!containerRef.current) return
    const timeout = setTimeout(() => {
      const container = containerRef.current
      if (!container) return

      // Try to find a live match first
      const liveEl = container.querySelector('[data-match-status="live"]')
      if (liveEl) {
        liveEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }

      // Otherwise scroll to the last finished match
      const finishedEls = container.querySelectorAll('[data-match-status="finished"]')
      if (finishedEls.length > 0) {
        finishedEls[finishedEls.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [])

  const handleSaveActualGoleador = () => {
    startGoleadorSaving(async () => {
      const result = await saveActualGoleador(roomId, actualGoleadorText)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Goleador oficial guardado y puntajes recalculados')
      }
    })
  }

  const bracketMatchNumbers = useMemo(
    () => new Set(ALL_BRACKET_MATCHES.map((m) => m.matchNumber)),
    []
  )

  const roundOrder = [
    'group',
    'round_of_32',
    'round_of_16',
    'quarter_finals',
    'semi_finals',
    'final',
  ] as const
  const matchesByRound = useMemo(() => {
    const rounds = [
      'group',
      'round_of_32',
      'round_of_16',
      'quarter_finals',
      'semi_finals',
      'final',
    ] as const
    const map = new Map<string, Match[]>()
    for (const round of rounds) {
      map.set(round, [])
    }
    for (const m of matches) {
      map.get(m.round)?.push(m)
    }
    return map
  }, [matches])

  if (matches.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-sm font-body text-gray-400">
          Aplica la migración 006 para ver los partidos aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Admin Panel */}
      {isAdmin && (
        <div className="glass-card p-4 sm:p-5 border-l-4 border-l-[#E61D25] bg-red-50/10 dark:bg-zinc-950/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#E61D25]/5 rounded-full blur-xl pointer-events-none" />
          <h3 className="font-display text-xs sm:text-sm text-gray-900 dark:text-white flex items-center gap-2 mb-2">
            ⚙️ Panel de Administrador de la Sala
          </h3>
          <p className="text-[11px] font-body text-gray-500 mb-4">
            Como administrador, puedes registrar el Goleador Oficial de la sala y actualizar los
            marcadores reales de cada partido.
          </p>
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 space-y-1.5 w-full">
              <label className="block text-[11px] font-body font-semibold text-gray-700 dark:text-gray-300">
                Goleador Oficial de la Sala
              </label>
              <input
                type="text"
                value={actualGoleadorText}
                onChange={(e) => setActualGoleadorText(e.target.value)}
                placeholder="Escribe el nombre del goleador (ej. Kylian Mbappé)..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs sm:text-sm font-body text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={handleSaveActualGoleador}
              disabled={isGoleadorSaving}
              className="px-4 py-2 bg-[#E61D25] hover:bg-red-700 text-white rounded-xl text-xs font-semibold font-body shadow disabled:opacity-50 transition-colors w-full sm:w-auto h-[38px] flex items-center justify-center"
            >
              {isGoleadorSaving ? 'Guardando...' : 'Guardar Goleador'}
            </button>
          </div>
        </div>
      )}

      {/* Legend + Info button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] font-body text-gray-400">
          <span>
            Signo correcto:{' '}
            <span className="text-[#3CAC3B] font-semibold">+{SIGN_POINTS} pts</span>
          </span>
          <span>
            Aprox. exacta:{' '}
            <span className="text-[#C9A84C] font-semibold">+4 pts base</span>
          </span>
        </div>
        <button
          onClick={() => setShowRules((v) => !v)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Reglas de puntuación"
        >
          <Info size={16} />
        </button>
      </div>

      {/* Scoring Rules Modal */}
      {showRules && (
        <div className="glass-card p-4 sm:p-5 border-l-4 border-l-[#2A398D] relative overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => setShowRules(false)}
            className="absolute top-3 right-3 p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-400"
          >
            <X size={14} />
          </button>
          <h3 className="font-display text-sm text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            📊 Sistema de Puntuación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-body text-gray-600 dark:text-gray-300">
            {/* Result Bets */}
            <div className="space-y-3">
              <div>
                <p className="font-bold text-gray-900 dark:text-white mb-1.5">
                  🎯 Predicción de Marcador
                </p>
                <div className="space-y-2 pl-1">
                  <div className="bg-[#3CAC3B]/5 dark:bg-[#3CAC3B]/10 rounded-lg p-2">
                    <p className="font-bold text-[#3CAC3B]">Acierto del Signo (1/X/2): +3 pts</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Si aciertas quién gana o si hay empate.</p>
                  </div>
                  <div className="bg-[#C9A84C]/5 dark:bg-[#C9A84C]/10 rounded-lg p-2">
                    <p className="font-bold text-[#C9A84C]">Aproximación al resultado: 0-4+ pts</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Base 4 pts + bonus por goles altos y diferencia grande, menos desvío de tu predicción.
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                      max(0, 4 + bonus − desvío)
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg p-2">
                    <p className="font-bold text-blue-600 dark:text-blue-400">Ejemplo: Partido 4-2, Apuesta 3-1</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Signo ✓ (+3) + Aprox: max(0, 4+1+0-2-0) = 3 → <strong>Total: 6 pts</strong>
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white mb-1">
                  📋 Clasificados de Grupos
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>
                    <span className="font-bold text-[#2A398D] dark:text-blue-400">5 pts</span>{' '}
                    por acertar 1.° de grupo
                  </li>
                  <li>
                    <span className="font-bold text-[#2A398D] dark:text-blue-400">5 pts</span>{' '}
                    por acertar 2.° de grupo
                  </li>
                </ul>
              </div>
            </div>

            {/* Team Bets + Knockout */}
            <div className="space-y-3">
              <div>
                <p className="font-bold text-gray-900 dark:text-white mb-1.5">
                  🏆 Team Bets (derivado de tu bracket)
                </p>
                <p className="text-[10px] text-gray-500 mb-1.5">
                  Si predices que un equipo gana en una ronda, implícitamente apuestas a que llega a la siguiente.
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-1">
                  <div>• Llega a Octavos: <span className="font-bold text-gray-900 dark:text-white">5 pts</span></div>
                  <div>• Llega a Cuartos: <span className="font-bold text-gray-900 dark:text-white">10 pts</span></div>
                  <div>• Llega a Semis: <span className="font-bold text-gray-900 dark:text-white">15 pts</span></div>
                  <div>• Llega a Final: <span className="font-bold text-gray-900 dark:text-white">25 pts</span></div>
                  <div className="col-span-2">• Gana el torneo: <span className="font-bold text-gray-900 dark:text-white">50 pts</span></div>
                </div>
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white mb-1">
                  ⚔️ Ganador de Eliminatoria
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-1">
                  <div>• R. de 32: <span className="font-bold text-gray-900 dark:text-white">10 pts</span></div>
                  <div>• Octavos: <span className="font-bold text-gray-900 dark:text-white">15 pts</span></div>
                  <div>• Cuartos: <span className="font-bold text-gray-900 dark:text-white">20 pts</span></div>
                  <div>• Semis: <span className="font-bold text-gray-900 dark:text-white">50 pts</span></div>
                  <div className="col-span-2">• Final: <span className="font-bold text-gray-900 dark:text-white">100 pts</span></div>
                </div>
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white mb-1">
                  🌟 Predicciones Especiales
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li><span className="font-bold text-[#C9A84C]">15 pts</span> Campeón del mundo</li>
                  <li><span className="font-bold text-[#C9A84C]">10 pts</span> Goleador del torneo</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {roundOrder.map((round) => {
        const roundMatches = matchesByRound.get(round) || []
        if (roundMatches.length === 0) return null

        const byDate = new Map<string, Match[]>()
        for (const m of roundMatches) {
          const dateKey = formatShortDate(m.match_date)
          if (!byDate.has(dateKey)) byDate.set(dateKey, [])
          byDate.get(dateKey)!.push(m)
        }

        return (
          <div key={round} className="glass-card overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06]">
              <span className="text-xs font-display text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {ROUND_LABELS[round]}
              </span>
            </div>

            {Array.from(byDate.entries()).map(([dateKey, dayMatches]) => (
              <div key={dateKey}>
                <div className="px-4 py-1.5 bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.04]">
                  <LocalTime
                    dateStr={dayMatches[0].match_date}
                    mode="short"
                    className="text-[10px] font-mono text-gray-400 uppercase tracking-wider"
                  />
                </div>
                {dayMatches.map((match) => (
                  <MatchRow
                    key={match.id}
                    roomId={roomId}
                    match={match}
                    knockoutPrediction={
                      bracketMatchNumbers.has(match.match_number)
                        ? (knockoutPredictions[match.match_number] ?? null)
                        : null
                    }
                    savedScore={scorePredictions[match.match_number] ?? null}
                    allMembersPredictions={allMembersPredictions}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ─── Match Row ────────────────────────────────────────────────────────

interface MatchRowProps {
  roomId: string
  match: Match
  knockoutPrediction: string | null
  savedScore: { home: number; away: number } | null
  allMembersPredictions?: MemberPredictions[]
  isAdmin?: boolean
}

function MatchRow({
  roomId,
  match,
  knockoutPrediction,
  savedScore,
  allMembersPredictions = [],
  isAdmin = false,
}: MatchRowProps) {
  const homeTeam = match.home_team_id ? TEAMS_BY_ID[match.home_team_id] : null
  const awayTeam = match.away_team_id ? TEAMS_BY_ID[match.away_team_id] : null

  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'
  const isScheduled = match.status === 'scheduled'

  // Score prediction state (user)
  const [homeScore, setHomeScore] = useState<string>(savedScore?.home?.toString() ?? '')
  const [awayScore, setAwayScore] = useState<string>(savedScore?.away?.toString() ?? '')
  const [isPending, startTransition] = useTransition()
  const [isBeforeDeadline, setIsBeforeDeadline] = useState(true)

  // Admin result editing state
  const [isAdminEditing, setIsAdminEditing] = useState(false)
  const [actualHomeScore, setActualHomeScore] = useState(match.home_score?.toString() ?? '')
  const [actualAwayScore, setActualAwayScore] = useState(match.away_score?.toString() ?? '')
  const [actualStatus, setActualStatus] = useState<typeof match.status>(match.status)
  const [isResultSaving, startResultSaving] = useTransition()

  useEffect(() => {
    const deadline = new Date(match.match_date)
    deadline.setMinutes(deadline.getMinutes() - 5)
    setIsBeforeDeadline(new Date() < deadline)
  }, [match.match_date])

  const canPredict = isScheduled && homeTeam && awayTeam

  const handleScoreSave = () => {
    const h = parseInt(homeScore)
    const a = parseInt(awayScore)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return

    startTransition(async () => {
      const result = await saveMatchScorePrediction(roomId, match.match_number, h, a)
      if (result?.error) toast.error(result.error)
    })
  }

  const handleAdminSaveResult = () => {
    const h = parseInt(actualHomeScore)
    const a = parseInt(actualAwayScore)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      toast.error('Marcadores oficiales inválidos')
      return
    }

    startResultSaving(async () => {
      const result = await saveMatchResult(match.id, roomId, h, a, actualStatus as any)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Resultado oficial guardado y puntajes recalculados')
        setIsAdminEditing(false)
      }
    })
  }

  // Calculate points using new formula if match is finished or live and user has a prediction
  const matchPoints = useMemo(() => {
    if (!savedScore || match.home_score == null || match.away_score == null) return null
    if (!isFinished && !isLive) return null
    return calculateMatchPoints(
      savedScore.home,
      savedScore.away,
      match.home_score,
      match.away_score
    )
  }, [savedScore, match.home_score, match.away_score, isFinished, isLive])

  // Live minutes: use DB elapsed directly (no frontend fallback that could exceed 90')
  const [liveElapsed, setLiveElapsed] = useState<number | null>(match.elapsed)

  useEffect(() => {
    if (isLive) {
      const calculateElapsed = () => {
        if (match.elapsed !== null && match.elapsed !== undefined) {
          setLiveElapsed(match.elapsed)
          return
        }
        // Fallback: cap at 90
        const matchDate = new Date(match.match_date)
        const elapsedMs = Date.now() - matchDate.getTime()
        const rawElapsed = Math.max(0, Math.floor(elapsedMs / 60000))
        setLiveElapsed(Math.min(90, rawElapsed))
      }

      calculateElapsed()
      const interval = setInterval(calculateElapsed, 30000)
      return () => clearInterval(interval)
    }
  }, [isLive, match.elapsed, match.match_date])

  return (
    <>
      <div
        data-match-status={match.status}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-white/[0.04] last:border-0 transition-all duration-300 relative overflow-hidden',
          isLive && 'bg-[#E61D25]/[0.03] dark:bg-red-500/[0.02] shadow-[inset_3px_0_0_0_#E61D25]'
        )}
      >
        {/* Home team */}
        <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
          {homeTeam ? (
            <>
              <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
                #{homeTeam.fifa_ranking}
              </span>
              <span className="text-xs font-body truncate max-w-[70px] sm:max-w-none text-gray-700 dark:text-gray-300">
                {homeTeam.name}
              </span>
              <TeamFlag flagCode={homeTeam.flag_code} name={homeTeam.name} size={16} />
            </>
          ) : (
            <span className="text-xs text-gray-400 font-body">TBD</span>
          )}
        </div>

        {/* Score / Time / Prediction */}
        <div className="flex flex-col items-center w-28 flex-shrink-0 gap-0.5">
          {isFinished ? (
            <>
              <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                {match.home_score} - {match.away_score}
              </span>
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                FINALIZADO
              </span>
            </>
          ) : isLive ? (
            <>
              <span className="font-mono text-sm font-bold text-[#E61D25] dark:text-red-500">
                {match.home_score ?? 0} - {match.away_score ?? 0}
              </span>
              <div className="flex items-center gap-1.5 bg-[#E61D25]/10 dark:bg-red-500/15 px-2 py-0.5 rounded-full border border-[#E61D25]/20 dark:border-red-500/20">
                <span className="w-1.5 h-1.5 bg-[#E61D25] rounded-full animate-pulse" />
                <span className="font-mono text-[9px] font-bold text-[#E61D25] dark:text-red-400">
                  {liveElapsed === 45 ? 'DT' : liveElapsed !== null ? `${liveElapsed}'` : 'EN VIVO'}
                </span>
              </div>
            </>
          ) : (
            <LocalTime
              dateStr={match.match_date}
              mode="full"
              className="font-mono text-xs text-gray-400"
            />
          )}

          {/* Score prediction inputs */}
          {canPredict && isBeforeDeadline && (
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                min={0}
                max={20}
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                onBlur={handleScoreSave}
                className="w-8 h-6 text-center text-xs font-mono rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] dark:text-white focus:border-[#2A398D] focus:outline-none"
                placeholder="-"
              />
              <span className="text-[9px] text-gray-300">-</span>
              <input
                type="number"
                min={0}
                max={20}
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                onBlur={handleScoreSave}
                className="w-8 h-6 text-center text-xs font-mono rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] dark:text-white focus:border-[#2A398D] focus:outline-none"
                placeholder="-"
              />
              {isPending && <Loader2 size={10} className="text-[#2A398D] animate-spin" />}
            </div>
          )}

          {/* Saved prediction display (after deadline or finished) */}
          {savedScore && !canPredict && (
            <span className="text-[10px] font-mono text-gray-400 mt-0.5">
              mi apuesta: {savedScore.home}-{savedScore.away}
            </span>
          )}
          {savedScore && canPredict && !isBeforeDeadline && (
            <span className="text-[10px] font-mono text-gray-400 mt-0.5">
              {savedScore.home}-{savedScore.away}
            </span>
          )}

          {/* Points badge (new system) */}
          {matchPoints && <PointsBadge points={matchPoints} />}

          {/* Knockout prediction indicator (only when no score prediction) */}
          {knockoutPrediction && !savedScore && (
            <PredictionBadge
              status={
                isFinished && match.winner_id
                  ? knockoutPrediction === match.winner_id
                    ? 'correct'
                    : 'wrong'
                  : 'pending'
              }
            />
          )}
        </div>

        {/* Away team */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {awayTeam ? (
            <>
              <TeamFlag flagCode={awayTeam.flag_code} name={awayTeam.name} size={16} />
              <span className="text-xs font-body truncate max-w-[70px] sm:max-w-none text-gray-700 dark:text-gray-300">
                {awayTeam.name}
              </span>
              <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
                #{awayTeam.fifa_ranking}
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-400 font-body">TBD</span>
          )}
        </div>

        {/* Admin edit button */}
        {isAdmin && (
          <button
            onClick={() => setIsAdminEditing(!isAdminEditing)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-gray-900 dark:hover:text-white"
            title="Editar resultado oficial"
          >
            <Edit size={12} />
          </button>
        )}
      </div>

      {/* Admin result editor drawer */}
      {isAdmin && isAdminEditing && (
        <div className="px-4 py-3 bg-red-50/10 dark:bg-zinc-800/40 border-b border-gray-100 dark:border-white/[0.04] flex flex-wrap items-center gap-4 text-xs font-body">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Resultado Oficial:
            </span>
            <input
              type="number"
              min={0}
              value={actualHomeScore}
              onChange={(e) => setActualHomeScore(e.target.value)}
              className="w-10 h-7 text-center rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#E61D25]"
              placeholder="0"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              min={0}
              value={actualAwayScore}
              onChange={(e) => setActualAwayScore(e.target.value)}
              className="w-10 h-7 text-center rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#E61D25]"
              placeholder="0"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Estado:</span>
            <select
              value={actualStatus}
              onChange={(e) => setActualStatus(e.target.value as any)}
              className="h-7 px-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#E61D25]"
            >
              <option value="scheduled">Programado</option>
              <option value="live">En Vivo</option>
              <option value="finished">Finalizado</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleAdminSaveResult}
              disabled={isResultSaving}
              className="px-3 py-1.5 bg-[#E61D25] text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors text-[10px]"
            >
              {isResultSaving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={() => setIsAdminEditing(false)}
              className="px-3 py-1.5 bg-gray-150 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-[10px]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Points Badge (new scoring system) ─────────────────────────────────

function PointsBadge({ points }: { points: { signPoints: number; extraPoints: number; total: number } }) {
  if (points.total === 0) {
    return (
      <div className="flex items-center gap-0.5">
        <X size={9} className="text-[#E61D25]" />
        <span className="text-[9px] font-mono text-[#E61D25]">0 pts</span>
      </div>
    )
  }

  const color = points.total >= 5 ? '#3CAC3B' : points.total >= 3 ? '#C9A84C' : '#2A398D'

  return (
    <div className="flex items-center gap-0.5">
      <Check size={9} style={{ color }} />
      <span className="text-[9px] font-mono font-bold" style={{ color }}>
        +{points.total} pts
      </span>
    </div>
  )
}

function PredictionBadge({ status }: { status: 'correct' | 'wrong' | 'pending' }) {
  if (status === 'correct') {
    return (
      <div className="flex items-center gap-0.5">
        <Check size={9} className="text-[#3CAC3B]" />
        <span className="text-[9px] font-mono text-[#3CAC3B]">ok</span>
      </div>
    )
  }
  if (status === 'wrong') {
    return (
      <div className="flex items-center gap-0.5">
        <X size={9} className="text-[#E61D25]" />
        <span className="text-[9px] font-mono text-[#E61D25]">fallé</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-0.5">
      <Clock size={9} className="text-gray-400" />
      <span className="text-[9px] font-mono text-gray-400">mi pick</span>
    </div>
  )
}
