'use client'

import { useState, useMemo, useTransition } from 'react'
import { Check, X, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import { TEAMS } from '@/lib/constants/teams'
import { ROUND_LABELS, SCORE_BONUS } from '@/lib/constants/points'
import { ALL_BRACKET_MATCHES } from '@/lib/constants/bracket'
import { formatShortDate } from '@/lib/utils/date'
import { saveMatchScorePrediction } from '@/app/actions/predictions'
import type { Match, GroupLetter, GroupPrediction } from '@/types/database'
import type { TeamData } from '@/lib/constants/teams'

const TEAMS_BY_ID: Record<string, TeamData> = Object.fromEntries(TEAMS.map((t) => [t.id, t]))

export interface ScorePrediction {
  matchNumber: number
  homeScore: number
  awayScore: number
}

interface ResultsTabProps {
  roomId: string
  matches: Match[]
  groupPredictions: Record<GroupLetter, GroupPrediction | null>
  knockoutPredictions: Record<number, string>
  scorePredictions: Record<number, { home: number; away: number }>
}

export function ResultsTab({ roomId, matches, groupPredictions, knockoutPredictions, scorePredictions }: ResultsTabProps) {
  const bracketMatchNumbers = useMemo(
    () => new Set(ALL_BRACKET_MATCHES.map((m) => m.matchNumber)),
    []
  )

  const roundOrder = ['group', 'round_of_32', 'round_of_16', 'quarter_finals', 'semi_finals', 'final'] as const
  const matchesByRound = useMemo(() => {
    const rounds = ['group', 'round_of_32', 'round_of_16', 'quarter_finals', 'semi_finals', 'final'] as const
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
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] font-body text-gray-400">
        <span>Resultado exacto: <span className="text-[#3CAC3B] font-semibold">+{SCORE_BONUS.exactScore} pts</span></span>
        <span>Ganador correcto: <span className="text-[#C9A84C] font-semibold">+{SCORE_BONUS.correctWinner} pt</span></span>
      </div>

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
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{dateKey}</span>
                </div>
                {dayMatches.map((match) => (
                  <MatchRow
                    key={match.id}
                    roomId={roomId}
                    match={match}
                    knockoutPrediction={
                      bracketMatchNumbers.has(match.match_number)
                        ? knockoutPredictions[match.match_number] ?? null
                        : null
                    }
                    savedScore={scorePredictions[match.match_number] ?? null}
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
}

function MatchRow({ roomId, match, knockoutPrediction, savedScore }: MatchRowProps) {
  const homeTeam = match.home_team_id ? TEAMS_BY_ID[match.home_team_id] : null
  const awayTeam = match.away_team_id ? TEAMS_BY_ID[match.away_team_id] : null
  const matchTime = new Date(match.match_date).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Mexico_City',
  })

  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'
  const isScheduled = match.status === 'scheduled'

  // Score prediction state
  const [homeScore, setHomeScore] = useState<string>(savedScore?.home?.toString() ?? '')
  const [awayScore, setAwayScore] = useState<string>(savedScore?.away?.toString() ?? '')
  const [isPending, startTransition] = useTransition()

  const canPredict = isScheduled && homeTeam && awayTeam
  const deadline = new Date(match.match_date)
  deadline.setMinutes(deadline.getMinutes() - 10)
  const isBeforeDeadline = new Date() < deadline

  const handleScoreSave = () => {
    const h = parseInt(homeScore)
    const a = parseInt(awayScore)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return

    startTransition(async () => {
      const result = await saveMatchScorePrediction(roomId, match.match_number, h, a)
      if (result?.error) toast.error(result.error)
    })
  }

  // Check correctness if finished
  let scoreStatus: 'exact' | 'winner' | 'wrong' | null = null
  if (isFinished && savedScore && match.home_score != null && match.away_score != null) {
    if (savedScore.home === match.home_score && savedScore.away === match.away_score) {
      scoreStatus = 'exact'
    } else {
      const actualWinner = match.home_score > match.away_score ? 'home' : match.away_score > match.home_score ? 'away' : 'draw'
      const predWinner = savedScore.home > savedScore.away ? 'home' : savedScore.away > savedScore.home ? 'away' : 'draw'
      scoreStatus = actualWinner === predWinner ? 'winner' : 'wrong'
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 border-b border-gray-50 dark:border-white/[0.04] last:border-0',
        isLive && 'bg-[#E61D25]/[0.03]'
      )}
    >
      {/* Home team */}
      <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
        {homeTeam ? (
          <>
            <span className="text-xs font-body truncate max-w-[70px] sm:max-w-none text-gray-700 dark:text-gray-300">
              {homeTeam.name}
            </span>
            <span className="text-base leading-none flex-shrink-0">{homeTeam.flag_emoji}</span>
          </>
        ) : (
          <span className="text-xs text-gray-400 font-body">TBD</span>
        )}
      </div>

      {/* Score / Time / Prediction */}
      <div className="flex flex-col items-center w-28 flex-shrink-0 gap-0.5">
        {isFinished ? (
          <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
            {match.home_score} - {match.away_score}
          </span>
        ) : isLive ? (
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#E61D25] rounded-full animate-pulse" />
            <span className="font-mono text-xs font-bold text-[#E61D25]">EN VIVO</span>
          </div>
        ) : (
          <span className="font-mono text-xs text-gray-400">{matchTime}</span>
        )}

        {/* Score prediction inputs */}
        {canPredict && isBeforeDeadline && (
          <div className="flex items-center gap-1">
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
          <span className="text-[10px] font-mono text-gray-400">
            mi apuesta: {savedScore.home}-{savedScore.away}
          </span>
        )}
        {savedScore && canPredict && !isBeforeDeadline && (
          <span className="text-[10px] font-mono text-gray-400">
            {savedScore.home}-{savedScore.away}
          </span>
        )}

        {/* Score correctness badge */}
        {scoreStatus && <ScoreBadge status={scoreStatus} />}

        {/* Knockout prediction indicator */}
        {knockoutPrediction && !savedScore && (
          <PredictionBadge
            status={
              isFinished && match.winner_id
                ? knockoutPrediction === match.winner_id ? 'correct' : 'wrong'
                : 'pending'
            }
          />
        )}
      </div>

      {/* Away team */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {awayTeam ? (
          <>
            <span className="text-base leading-none flex-shrink-0">{awayTeam.flag_emoji}</span>
            <span className="text-xs font-body truncate max-w-[70px] sm:max-w-none text-gray-700 dark:text-gray-300">
              {awayTeam.name}
            </span>
          </>
        ) : (
          <span className="text-xs text-gray-400 font-body">TBD</span>
        )}
      </div>
    </div>
  )
}

function ScoreBadge({ status }: { status: 'exact' | 'winner' | 'wrong' }) {
  if (status === 'exact') {
    return (
      <div className="flex items-center gap-0.5">
        <Check size={9} className="text-[#3CAC3B]" />
        <span className="text-[9px] font-mono text-[#3CAC3B]">+3 exacto</span>
      </div>
    )
  }
  if (status === 'winner') {
    return (
      <div className="flex items-center gap-0.5">
        <Check size={9} className="text-[#C9A84C]" />
        <span className="text-[9px] font-mono text-[#C9A84C]">+1 ganador</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-0.5">
      <X size={9} className="text-[#E61D25]" />
      <span className="text-[9px] font-mono text-[#E61D25]">fallé</span>
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
