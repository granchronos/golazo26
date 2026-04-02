'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
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

// Resolve which team the user picked for a given slot in a bracket match
function resolveTeam(
  match: BracketMatchDef,
  side: 'home' | 'away',
  predictions: Record<number, string>
): TeamData | null {
  const slot = match[side]
  const { source } = slot
  if (source.kind === '1st' || source.kind === '2nd' || source.kind === '3rd_pool') {
    // For R32: the resolved team comes from the user's pick on that match
    // Since the user picked a winner for this match, we can look at who they
    // chose in the match. But we need the two candidates. For R32 teams come
    // from group predictions, which we don't have here directly.
    // Instead, just show the winner the user picked for THIS match if any.
    return null
  }
  if (source.kind === 'winner') {
    const winnerId = predictions[source.matchNumber]
    return winnerId ? TEAMS_BY_ID[winnerId] ?? null : null
  }
  return null
}

export function BracketPopup({ knockoutPredictions }: BracketPopupProps) {
  // The user's championship path: just show picks per round
  const champion = knockoutPredictions[103] ? TEAMS_BY_ID[knockoutPredictions[103]] : null

  // Build round data
  const rounds = useMemo(() => [
    { label: 'Ronda de 32', short: '32avos', matches: R32_BRACKET, color: 'text-gray-500' },
    { label: 'Octavos', short: '8vos', matches: R16_BRACKET, color: 'text-[#2A398D]' },
    { label: 'Cuartos', short: '4tos', matches: QF_BRACKET, color: 'text-[#3CAC3B]' },
    { label: 'Semis', short: 'Semis', matches: SF_BRACKET, color: 'text-[#C9A84C]' },
    { label: 'Final', short: 'Final', matches: FINAL_BRACKET, color: 'text-[#E61D25]' },
  ], [])

  return (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto overscroll-contain pr-1">
      {/* Champion banner */}
      {champion && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-1 py-3 rounded-xl bg-gradient-to-r from-[#C9A84C]/20 via-[#C9A84C]/10 to-[#C9A84C]/20 border border-[#C9A84C]/30"
        >
          <Trophy size={20} className="text-[#C9A84C]" />
          <span className="text-2xl">{champion.flag_emoji}</span>
          <span className="text-sm font-display text-[#C9A84C] tracking-wide">{champion.name}</span>
          <span className="text-[10px] font-mono text-gray-400">MI CAMPEÓN</span>
        </motion.div>
      )}

      {/* Bracket rounds — from Final down to R32 (reverse for top-down view) */}
      {[...rounds].reverse().map((round, roundIdx) => (
        <div key={round.label}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn('text-[10px] font-display uppercase tracking-wider', round.color)}>
              {round.label}
            </span>
            <div className="flex-1 h-px bg-gray-100 dark:bg-white/[0.06]" />
          </div>
          <div className="grid gap-1.5" style={{
            gridTemplateColumns: round.matches.length <= 2
              ? 'repeat(auto-fit, minmax(0, 1fr))'
              : 'repeat(auto-fill, minmax(140px, 1fr))',
          }}>
            {round.matches.map((match) => (
              <BracketMatchCard
                key={match.matchNumber}
                match={match}
                predictions={knockoutPredictions}
                roundColor={round.color}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {!champion && Object.keys(knockoutPredictions).length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm font-body text-gray-400">
            Aún no has elegido ningún equipo en la fase de eliminación
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Single Bracket Match Card ───────────────────────────────────────

interface BracketMatchCardProps {
  match: BracketMatchDef
  predictions: Record<number, string>
  roundColor: string
}

function BracketMatchCard({ match, predictions, roundColor }: BracketMatchCardProps) {
  const winner = predictions[match.matchNumber]
  const winnerTeam = winner ? TEAMS_BY_ID[winner] : null

  // Try to resolve home/away from previous-round predictions
  const homeTeam = resolveTeam(match, 'home', predictions)
  const awayTeam = resolveTeam(match, 'away', predictions)

  if (!winnerTeam && !homeTeam && !awayTeam) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04]">
        <span className="text-[10px] font-mono text-gray-300 dark:text-gray-600">P{match.matchNumber}</span>
        <span className="text-[10px] text-gray-300 dark:text-gray-600">—</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
      <span className="text-[10px] font-mono text-gray-300 dark:text-gray-600 w-6 flex-shrink-0">P{match.matchNumber}</span>

      {/* Show vs if we have both teams */}
      {homeTeam && awayTeam ? (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <TeamBadge
            team={homeTeam}
            isWinner={winnerTeam?.id === homeTeam.id}
          />
          <span className="text-[9px] text-gray-300 dark:text-gray-600 flex-shrink-0">vs</span>
          <TeamBadge
            team={awayTeam}
            isWinner={winnerTeam?.id === awayTeam.id}
          />
        </div>
      ) : winnerTeam ? (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-sm flex-shrink-0">{winnerTeam.flag_emoji}</span>
          <span className={cn('text-xs font-body truncate font-medium', roundColor)}>
            {winnerTeam.code}
          </span>
        </div>
      ) : null}
    </div>
  )
}

function TeamBadge({ team, isWinner }: { team: TeamData; isWinner: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-0.5 px-1 py-0.5 rounded',
      isWinner
        ? 'bg-[#3CAC3B]/10 ring-1 ring-[#3CAC3B]/30'
        : 'opacity-40'
    )}>
      <span className="text-xs flex-shrink-0">{team.flag_emoji}</span>
      <span className={cn(
        'text-[10px] font-body truncate',
        isWinner ? 'font-semibold text-[#3CAC3B]' : 'text-gray-400'
      )}>
        {team.code}
      </span>
    </div>
  )
}
