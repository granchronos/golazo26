'use client'

import { useState, useTransition, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, ChevronDown, Trophy, Star } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import { WCBadge } from '@/components/ui/WCBadge'
import { saveKnockoutPrediction } from '@/app/actions/predictions'
import { TEAMS, TEAMS_BY_GROUP } from '@/lib/constants/teams'
import { BRACKET_ROUNDS, ALL_BRACKET_MATCHES } from '@/lib/constants/bracket'
import { StaggerContainer, StaggerItem } from '@/components/animations/PageTransition'
import type { GroupLetter } from '@/types/database'
import type { TeamData } from '@/lib/constants/teams'
import type { SlotSource, BracketMatchDef } from '@/lib/constants/bracket'

const TEAMS_BY_ID: Record<string, TeamData> = Object.fromEntries(TEAMS.map((t) => [t.id, t]))

interface KnockoutPredictionsProps {
  roomId: string
  groupSelections: Record<GroupLetter, { first: string | null; second: string | null }>
  existingPredictions: Record<number, string>
}

export function KnockoutPredictions({
  roomId,
  groupSelections,
  existingPredictions,
}: KnockoutPredictionsProps) {
  const [picks, setPicks] = useState<Record<number, string>>(existingPredictions)
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [, startTransition] = useTransition()

  const resolveTeam = useCallback(
    (source: SlotSource): TeamData | null => {
      if (source.kind === '1st') return TEAMS_BY_ID[groupSelections[source.group]?.first ?? ''] ?? null
      if (source.kind === '2nd') return TEAMS_BY_ID[groupSelections[source.group]?.second ?? ''] ?? null
      if (source.kind === 'winner') return TEAMS_BY_ID[picks[source.matchNumber] ?? ''] ?? null
      return null
    },
    [groupSelections, picks]
  )

  const getPoolTeams = useCallback(
    (groups: [GroupLetter, GroupLetter]): TeamData[] => {
      return groups.flatMap((g) => {
        const first = groupSelections[g]?.first
        const second = groupSelections[g]?.second
        return (TEAMS_BY_GROUP[g] || []).filter((t) => t.id !== first && t.id !== second)
      })
    },
    [groupSelections]
  )

  const handlePick = useCallback(
    (matchNumber: number, teamId: string) => {
      setPicks((prev) => ({ ...prev, [matchNumber]: teamId }))
      setSaving((prev) => ({ ...prev, [matchNumber]: true }))

      startTransition(async () => {
        const result = await saveKnockoutPrediction(roomId, matchNumber, teamId)
        setSaving((prev) => ({ ...prev, [matchNumber]: false }))
        if (result?.error) {
          toast.error(result.error)
          setPicks((prev) => {
            const next = { ...prev }
            delete next[matchNumber]
            return next
          })
        }
      })
    },
    [roomId]
  )

  const totalPicked = Object.keys(picks).length
  const totalMatches = ALL_BRACKET_MATCHES.length

  // Champion = winner of the Final (match 103)
  const champion = picks[103] ? TEAMS_BY_ID[picks[103]] : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl dark:text-white">Fase Eliminatoria</h3>
          <p className="text-xs font-body text-gray-400 mt-0.5">
            <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{totalPicked}</span>
            /{totalMatches} pronósticos guardados
          </p>
        </div>
        {champion && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/30"
          >
            <Trophy size={13} className="text-[#C9A84C]" />
            <span className="text-xs font-body font-semibold text-[#C9A84C]">
              {champion.flag_emoji} {champion.name}
            </span>
          </motion.div>
        )}
      </div>

      {/* Rounds */}
      {BRACKET_ROUNDS.map((round, roundIndex) => {
        const isCollapsed = collapsed[round.id]
        const roundPicked = round.matches.filter((m) => picks[m.matchNumber]).length

        return (
          <div key={round.id} id={`knockout-round-${roundIndex}`} className="glass-card overflow-hidden">
            {/* Round header */}
            <button
              onClick={() => setCollapsed((p) => ({ ...p, [round.id]: !p[round.id] }))}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-display text-sm dark:text-white">{round.label}</span>
                <span className="text-[10px] font-mono text-[#C9A84C] bg-[#C9A84C]/10 px-1.5 py-0.5 rounded-full">
                  +{round.points} pts
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-400">
                  {roundPicked}/{round.matches.length}
                </span>
                <ChevronDown
                  size={14}
                  className={cn(
                    'text-gray-400 transition-transform duration-200',
                    isCollapsed && '-rotate-90'
                  )}
                />
              </div>
            </button>

            {/* Matches */}
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-gray-100 dark:border-white/[0.06] divide-y divide-gray-50 dark:divide-white/[0.04]">
                    {round.matches.map((matchDef) => (
                      <MatchCard
                        key={matchDef.matchNumber}
                        matchDef={matchDef}
                        pick={picks[matchDef.matchNumber] ?? null}
                        isSaving={!!saving[matchDef.matchNumber]}
                        resolveTeam={resolveTeam}
                        getPoolTeams={getPoolTeams}
                        onPick={handlePick}
                        isFinal={round.id === 'final'}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// ─── Individual Match Card ───────────────────────────────────────────

interface MatchCardProps {
  matchDef: BracketMatchDef
  pick: string | null
  isSaving: boolean
  resolveTeam: (source: SlotSource) => TeamData | null
  getPoolTeams: (groups: [GroupLetter, GroupLetter]) => TeamData[]
  onPick: (matchNumber: number, teamId: string) => void
  isFinal: boolean
}

function MatchCard({
  matchDef,
  pick,
  isSaving,
  resolveTeam,
  getPoolTeams,
  onPick,
  isFinal,
}: MatchCardProps) {
  const isPool =
    matchDef.home.source.kind === '3rd_pool' || matchDef.away.source.kind === '3rd_pool'

  const matchDate = new Date(matchDef.matchDate)
  const dateLabel = matchDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Mexico_City',
  })
  const timeLabel = matchDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Mexico_City',
  })

  if (isPool) {
    // Pool match: flatten teams from both home and away pool sources
    const homeSource = matchDef.home.source
    const awaySource = matchDef.away.source
    const homeGroups = homeSource.kind === '3rd_pool' ? homeSource.groups : null
    const awayGroups = awaySource.kind === '3rd_pool' ? awaySource.groups : null
    const poolTeams = [
      ...(homeGroups ? getPoolTeams(homeGroups) : []),
      ...(awayGroups ? getPoolTeams(awayGroups) : []),
    ]

    return (
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-gray-400">
              P{matchDef.matchNumber} · {matchDef.home.label} vs {matchDef.away.label}
            </p>
            <p className="text-[10px] text-gray-400 font-body">{dateLabel} · {timeLabel}</p>
          </div>
          <SaveIndicator isSaving={isSaving} pick={pick} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {poolTeams.length === 0 ? (
            <p className="text-xs text-gray-400 font-body italic">
              Llena primero tus pronósticos de grupos para ver los equipos disponibles
            </p>
          ) : (
            poolTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => onPick(matchDef.matchNumber, team.id)}
                disabled={isSaving}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-body transition-all',
                  pick === team.id
                    ? 'bg-[#2A398D] border-[#2A398D] text-white font-semibold'
                    : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-[#2A398D]/40 hover:bg-[#2A398D]/5'
                )}
              >
                <span>{team.flag_emoji}</span>
                <span>{team.code}</span>
              </button>
            ))
          )}
        </div>
      </div>
    )
  }

  // Standard match: home vs away
  const homeTeam = resolveTeam(matchDef.home.source)
  const awayTeam = resolveTeam(matchDef.away.source)

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-mono text-gray-400">
          P{matchDef.matchNumber} · {dateLabel} · {timeLabel}
        </p>
        <SaveIndicator isSaving={isSaving} pick={pick} />
      </div>

      <div className="flex items-stretch gap-2">
        {/* Home team */}
        <TeamButton
          team={homeTeam}
          label={matchDef.home.label}
          isPicked={!!homeTeam && pick === homeTeam.id}
          isLoser={!!awayTeam && !!pick && pick === awayTeam.id}
          disabled={!homeTeam || !awayTeam || isSaving}
          isFinal={isFinal}
          onClick={() => homeTeam && onPick(matchDef.matchNumber, homeTeam.id)}
        />

        <div className="flex items-center justify-center w-7 flex-shrink-0">
          <span className="text-[10px] font-mono text-gray-300 dark:text-white/20">vs</span>
        </div>

        {/* Away team */}
        <TeamButton
          team={awayTeam}
          label={matchDef.away.label}
          isPicked={!!awayTeam && pick === awayTeam.id}
          isLoser={!!homeTeam && !!pick && pick === homeTeam.id}
          disabled={!homeTeam || !awayTeam || isSaving}
          isFinal={isFinal}
          onClick={() => awayTeam && onPick(matchDef.matchNumber, awayTeam.id)}
        />
      </div>
    </div>
  )
}

// ─── Team Button ─────────────────────────────────────────────────────

interface TeamButtonProps {
  team: TeamData | null
  label: string
  isPicked: boolean
  isLoser: boolean
  disabled: boolean
  isFinal: boolean
  onClick: () => void
}

function TeamButton({ team, label, isPicked, isLoser, disabled, isFinal, onClick }: TeamButtonProps) {
  if (!team) {
    return (
      <div className="flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl border border-dashed border-gray-200 dark:border-white/[0.06] opacity-50">
        <span className="text-base">⚽</span>
        <span className="text-[10px] font-body text-gray-400 text-center leading-tight">{label}</span>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl border transition-all duration-150',
        isPicked
          ? isFinal
            ? 'bg-[#C9A84C]/10 border-[#C9A84C] shadow-sm'
            : 'bg-[#2A398D]/10 border-[#2A398D] shadow-sm'
          : isLoser
          ? 'opacity-40 border-gray-100 dark:border-white/[0.04]'
          : 'border-gray-200 dark:border-white/[0.08] hover:border-[#2A398D]/40 hover:bg-[#2A398D]/5 active:scale-95'
      )}
    >
      <span className="text-xl leading-none">{team.flag_emoji}</span>
      <span
        className={cn(
          'text-[11px] font-body font-medium text-center leading-tight',
          isPicked
            ? isFinal
              ? 'text-[#C9A84C]'
              : 'text-[#2A398D] dark:text-blue-400'
            : 'text-gray-700 dark:text-gray-300'
        )}
      >
        {team.code}
      </span>
      <WCBadge teamId={team.id} size="xs" />
      {isPicked && (
        <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-[#2A398D] dark:text-blue-400">
          {isFinal ? '🏆' : '✓'}
        </span>
      )}
    </button>
  )
}

// ─── Save Indicator ───────────────────────────────────────────────────

function SaveIndicator({ isSaving, pick }: { isSaving: boolean; pick: string | null }) {
  if (isSaving) return <Loader2 size={12} className="text-[#2A398D] animate-spin" />
  if (pick) return <Check size={12} className="text-[#3CAC3B]" />
  return null
}
