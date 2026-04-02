'use client'

import { useMemo } from 'react'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { TEAMS } from '@/lib/constants/teams'
import {
  R32_BRACKET,
  R16_BRACKET,
  QF_BRACKET,
  SF_BRACKET,
  FINAL_BRACKET,
  type BracketMatchDef,
} from '@/lib/constants/bracket'
import type { TeamData } from '@/lib/constants/teams'

const TEAMS_BY_ID: Record<string, TeamData> = Object.fromEntries(TEAMS.map((t) => [t.id, t]))

interface BracketPopupProps {
  knockoutPredictions: Record<number, string>
}

function resolveTeam(
  match: BracketMatchDef,
  side: 'home' | 'away',
  predictions: Record<number, string>
): TeamData | null {
  const { source } = match[side]
  if (source.kind === 'winner') {
    const winnerId = predictions[source.matchNumber]
    return winnerId ? TEAMS_BY_ID[winnerId] ?? null : null
  }
  return null
}

// ─── Bracket Node (a single match) ────────────────────────────────

function BracketNode({
  match,
  predictions,
  accentColor,
  size = 'normal',
}: {
  match: BracketMatchDef
  predictions: Record<number, string>
  accentColor: string
  size?: 'normal' | 'large'
}) {
  const winner = predictions[match.matchNumber]
  const winnerTeam = winner ? TEAMS_BY_ID[winner] : null
  const homeTeam = resolveTeam(match, 'home', predictions)
  const awayTeam = resolveTeam(match, 'away', predictions)

  const isLarge = size === 'large'

  if (!winnerTeam && !homeTeam && !awayTeam) {
    return (
      <div className={cn(
        'rounded-lg border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-center',
        isLarge ? 'h-14' : 'h-11'
      )}>
        <span className="text-[10px] font-mono text-gray-300 dark:text-gray-600">P{match.matchNumber}</span>
      </div>
    )
  }

  if (homeTeam && awayTeam) {
    return (
      <div className={cn(
        'rounded-lg border overflow-hidden',
        isLarge ? 'border-2' : '',
        winnerTeam ? 'border-gray-200 dark:border-white/10' : 'border-dashed border-gray-200 dark:border-white/10'
      )}>
        <TeamRow team={homeTeam} isWinner={winnerTeam?.id === homeTeam.id} isLarge={isLarge} accentColor={accentColor} />
        <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />
        <TeamRow team={awayTeam} isWinner={winnerTeam?.id === awayTeam.id} isLarge={isLarge} accentColor={accentColor} />
      </div>
    )
  }

  return (
    <div className={cn(
      'rounded-lg border border-gray-200 dark:border-white/10 flex items-center gap-2 px-2.5',
      isLarge ? 'h-14' : 'h-11'
    )}>
      <span className={isLarge ? 'text-xl' : 'text-base'}>{winnerTeam?.flag_emoji}</span>
      <span className={cn('font-body font-semibold truncate', accentColor, isLarge ? 'text-sm' : 'text-xs')}>
        {winnerTeam?.name ?? winnerTeam?.code}
      </span>
    </div>
  )
}

function TeamRow({ team, isWinner, isLarge, accentColor }: {
  team: TeamData
  isWinner: boolean
  isLarge: boolean
  accentColor: string
}) {
  return (
    <div className={cn(
      'flex items-center gap-2 px-2.5 transition-colors',
      isLarge ? 'py-1.5' : 'py-1',
      isWinner ? 'bg-[#3CAC3B]/10' : 'bg-white dark:bg-white/[0.02]'
    )}>
      <span className={isLarge ? 'text-base' : 'text-sm'}>{team.flag_emoji}</span>
      <span className={cn(
        'font-body truncate flex-1',
        isLarge ? 'text-xs' : 'text-[11px]',
        isWinner ? 'font-semibold text-[#3CAC3B]' : 'text-gray-500 dark:text-gray-400'
      )}>
        {team.code}
      </span>
      {isWinner && (
        <span className="text-[8px] font-mono text-[#3CAC3B]">▶</span>
      )}
    </div>
  )
}

// ─── Main Bracket ──────────────────────────────────────────────────

export function BracketPopup({ knockoutPredictions }: BracketPopupProps) {
  const champion = knockoutPredictions[103] ? TEAMS_BY_ID[knockoutPredictions[103]] : null

  const rounds = useMemo(() => [
    { label: '32avos', matches: R32_BRACKET, color: 'text-gray-500', accent: 'text-gray-600 dark:text-gray-300' },
    { label: 'Octavos', matches: R16_BRACKET, color: 'text-[#2A398D]', accent: 'text-[#2A398D]' },
    { label: 'Cuartos', matches: QF_BRACKET, color: 'text-[#3CAC3B]', accent: 'text-[#3CAC3B]' },
    { label: 'Semifinales', matches: SF_BRACKET, color: 'text-[#C9A84C]', accent: 'text-[#C9A84C]' },
    { label: 'FINAL', matches: FINAL_BRACKET, color: 'text-[#E61D25]', accent: 'text-[#E61D25]' },
  ], [])

  const hasAnyPicks = Object.keys(knockoutPredictions).length > 0

  return (
    <div className="max-h-[75vh] overflow-y-auto overscroll-contain space-y-0 pr-1">
      {/* Champion crown */}
      {champion && (
        <div className="flex flex-col items-center gap-1.5 pt-2 pb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#C9A84C]/20">
            <Trophy size={22} className="text-white" />
          </div>
          <span className="text-3xl">{champion.flag_emoji}</span>
          <span className="text-sm font-display text-[#C9A84C] tracking-wide">{champion.name}</span>
          <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Campeón</span>
          {/* Connector line down */}
          <div className="w-px h-4 bg-gradient-to-b from-[#C9A84C]/40 to-gray-200 dark:to-white/10" />
        </div>
      )}

      {/* Rounds bottom-up: Final → R32 */}
      {[...rounds].reverse().map((round, roundIdx) => {
        const isFirst = roundIdx === 0
        const matchCount = round.matches.length
        const isFinal = matchCount === 1
        const isSemis = matchCount === 2

        return (
          <div key={round.label} className="relative">
            {/* Round label */}
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-1.5 h-1.5 rounded-full', round.color.replace('text-', 'bg-'))} />
              <span className={cn('text-[10px] font-display uppercase tracking-wider', round.color)}>
                {round.label}
              </span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-white/[0.06]" />
              <span className="text-[10px] font-mono text-gray-300 dark:text-gray-600">
                {round.matches.filter(m => knockoutPredictions[m.matchNumber]).length}/{matchCount}
              </span>
            </div>

            {/* Match grid */}
            <div className={cn(
              'grid gap-2 mb-3',
              isFinal ? 'grid-cols-1 max-w-[200px] mx-auto' :
              isSemis ? 'grid-cols-2' :
              matchCount <= 4 ? 'grid-cols-2' :
              'grid-cols-2 sm:grid-cols-4'
            )}>
              {round.matches.map((match) => (
                <BracketNode
                  key={match.matchNumber}
                  match={match}
                  predictions={knockoutPredictions}
                  accentColor={round.accent}
                  size={isFinal ? 'large' : 'normal'}
                />
              ))}
            </div>

            {/* Connector arrows between rounds */}
            {!isFirst && (
              <div className="flex justify-center py-1">
                <div className="flex flex-col items-center">
                  <div className="w-px h-3 bg-gray-200 dark:bg-white/10" />
                  <svg width="10" height="6" viewBox="0 0 10 6" className="text-gray-300 dark:text-gray-600">
                    <path d="M5 0L10 6H0z" fill="currentColor" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Empty state */}
      {!hasAnyPicks && (
        <div className="text-center py-8">
          <Trophy size={24} className="mx-auto mb-2 text-gray-300 dark:text-white/10" />
          <p className="text-sm font-body text-gray-400">
            Aún no has elegido ningún equipo en la fase de eliminación
          </p>
        </div>
      )}
    </div>
  )
}
