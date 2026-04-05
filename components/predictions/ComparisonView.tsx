'use client'

import { useState } from 'react'
import { GitCompareArrows } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { TEAMS, GROUP_LETTERS } from '@/lib/constants/teams'
import { BRACKET_ROUNDS, ALL_BRACKET_MATCHES } from '@/lib/constants/bracket'
import type { SlotSource } from '@/lib/constants/bracket'
import type { TeamData } from '@/lib/constants/teams'
import type { GroupLetter, GroupPrediction } from '@/types/database'

const TEAMS_BY_ID: Record<string, TeamData> = Object.fromEntries(TEAMS.map((t) => [t.id, t]))

// Resolve which team a person has at each slot based on their group + knockout predictions
function resolveSlot(
  source: SlotSource,
  groupPreds: Record<GroupLetter, GroupPrediction | null>,
  knockoutPreds: Record<number, string>
): string | null {
  switch (source.kind) {
    case '1st':
      return groupPreds[source.group]?.team_1st_id ?? null
    case '2nd':
      return groupPreds[source.group]?.team_2nd_id ?? null
    case '3rd_pool':
      // For 3rd-place pool matches, the team is the winner of this match
      return null
    case 'winner':
      return knockoutPreds[source.matchNumber] ?? null
  }
}

function resolveMatchup(
  matchNumber: number,
  groupPreds: Record<GroupLetter, GroupPrediction | null>,
  knockoutPreds: Record<number, string>
): { home: string | null; away: string | null } {
  const match = ALL_BRACKET_MATCHES.find((m) => m.matchNumber === matchNumber)
  if (!match) return { home: null, away: null }
  return {
    home: resolveSlot(match.home.source, groupPreds, knockoutPreds),
    away: resolveSlot(match.away.source, groupPreds, knockoutPreds),
  }
}

interface MemberData {
  userId: string
  name: string
  groupPredictions: Record<GroupLetter, GroupPrediction | null>
  knockoutPredictions: Record<number, string>
  isComplete: boolean
}

interface ComparisonViewProps {
  currentUserId: string
  allMembers: MemberData[]
}

export function ComparisonView({ currentUserId, allMembers }: ComparisonViewProps) {
  const [compareWith, setCompareWith] = useState<string | null>(null)

  const me = allMembers.find((m) => m.userId === currentUserId)
  const other = compareWith ? allMembers.find((m) => m.userId === compareWith) : null
  const otherMembers = allMembers.filter((m) => m.userId !== currentUserId)

  if (otherMembers.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <GitCompareArrows size={24} className="mx-auto mb-2 text-gray-300 dark:text-white/10" />
        <p className="text-sm font-body text-gray-400">Aún no hay otros miembros para comparar</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Member selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-body text-gray-400">Comparar con:</span>
        {otherMembers.map((m) => (
          <button
            key={m.userId}
            onClick={() => setCompareWith(m.userId === compareWith ? null : m.userId)}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-body font-medium transition-colors min-h-[44px] flex items-center',
              compareWith === m.userId
                ? 'bg-[#2A398D] text-white'
                : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
            )}
          >
            {m.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {other && me && (
        <div className="space-y-3">
          {/* Column headers */}
          <div className="flex items-center px-2 sm:px-4 gap-2">
            <span className="w-4" />
            <span className="flex-1 text-[10px] font-display uppercase tracking-wider text-[#2A398D] dark:text-blue-400">Tú</span>
            <span className="w-6" />
            <span className="flex-1 text-[10px] font-display uppercase tracking-wider text-right text-[#E61D25]">{other.name.split(' ')[0]}</span>
          </div>

          {/* Groups comparison */}
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-display text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fase de Grupos</span>
              {(() => {
                let matches = 0, total = 0
                for (const letter of GROUP_LETTERS) {
                  const mp = me.groupPredictions[letter]
                  const tp = other.groupPredictions[letter]
                  if (mp && tp) { total += 2; if (mp.team_1st_id === tp.team_1st_id) matches++; if (mp.team_2nd_id === tp.team_2nd_id) matches++ }
                }
                return total > 0 ? <span className="text-[10px] font-mono text-[#3CAC3B]">{matches}/{total} iguales</span> : null
              })()}
            </div>
            <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {GROUP_LETTERS.map((letter) => {
                const myPred = me.groupPredictions[letter]
                const theirPred = other.groupPredictions[letter]
                if (!myPred && !theirPred) return null
                const same1st = myPred && theirPred && myPred.team_1st_id === theirPred.team_1st_id
                const same2nd = myPred && theirPred && myPred.team_2nd_id === theirPred.team_2nd_id
                const my1st = myPred ? TEAMS_BY_ID[myPred.team_1st_id] : null
                const my2nd = myPred ? TEAMS_BY_ID[myPred.team_2nd_id] : null
                const their1st = theirPred ? TEAMS_BY_ID[theirPred.team_1st_id] : null
                const their2nd = theirPred ? TEAMS_BY_ID[theirPred.team_2nd_id] : null
                return (
                  <div key={letter} className="flex items-center px-2 sm:px-4 py-2.5 gap-1.5 sm:gap-2">
                    <span className="text-[10px] font-mono font-bold text-gray-400 w-4">{letter}</span>
                    <div className="flex-1 flex items-center gap-1.5">
                      {my1st ? <span className={cn('text-xs font-body', same1st ? 'text-[#3CAC3B] font-semibold' : 'text-gray-700 dark:text-gray-300')}>{my1st.flag_emoji} {my1st.code}</span> : <span className="text-xs text-gray-300">—</span>}
                      <span className="text-gray-200 dark:text-gray-700">/</span>
                      {my2nd ? <span className={cn('text-xs font-body', same2nd ? 'text-[#3CAC3B] font-semibold' : 'text-gray-700 dark:text-gray-300')}>{my2nd.flag_emoji} {my2nd.code}</span> : <span className="text-xs text-gray-300">—</span>}
                    </div>
                    <span className={cn('text-[10px] w-6 text-center', same1st && same2nd ? 'text-[#3CAC3B]' : 'text-gray-300 dark:text-gray-600')}>{same1st && same2nd ? '✓' : 'vs'}</span>
                    <div className="flex-1 flex items-center gap-1.5 justify-end">
                      {their1st ? <span className={cn('text-xs font-body', same1st ? 'text-[#3CAC3B] font-semibold' : 'text-gray-700 dark:text-gray-300')}>{their1st.flag_emoji} {their1st.code}</span> : <span className="text-xs text-gray-300">—</span>}
                      <span className="text-gray-200 dark:text-gray-700">/</span>
                      {their2nd ? <span className={cn('text-xs font-body', same2nd ? 'text-[#3CAC3B] font-semibold' : 'text-gray-700 dark:text-gray-300')}>{their2nd.flag_emoji} {their2nd.code}</span> : <span className="text-xs text-gray-300">—</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Knockout comparison */}
          {BRACKET_ROUNDS.map((round) => {
            const matchesWithPicks = round.matches.filter((m) => me.knockoutPredictions[m.matchNumber] || other.knockoutPredictions[m.matchNumber])
            if (matchesWithPicks.length === 0) return null
            const sameCount = matchesWithPicks.filter((m) => me.knockoutPredictions[m.matchNumber] && me.knockoutPredictions[m.matchNumber] === other.knockoutPredictions[m.matchNumber]).length
            return (
              <div key={round.id} className="glass-card overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs font-display text-gray-500 dark:text-gray-400 uppercase tracking-wide">{round.label}</span>
                  <span className="text-[10px] font-mono text-[#3CAC3B]">{sameCount}/{matchesWithPicks.length} iguales</span>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                  {matchesWithPicks.map((m) => {
                    const myWinnerId = me.knockoutPredictions[m.matchNumber]
                    const theirWinnerId = other.knockoutPredictions[m.matchNumber]
                    const myWinner = myWinnerId ? TEAMS_BY_ID[myWinnerId] : null
                    const theirWinner = theirWinnerId ? TEAMS_BY_ID[theirWinnerId] : null
                    const sameWinner = myWinnerId && myWinnerId === theirWinnerId

                    // Resolve matchup for each person
                    const myMatchup = resolveMatchup(m.matchNumber, me.groupPredictions, me.knockoutPredictions)
                    const theirMatchup = resolveMatchup(m.matchNumber, other.groupPredictions, other.knockoutPredictions)
                    const myHome = myMatchup.home ? TEAMS_BY_ID[myMatchup.home] : null
                    const myAway = myMatchup.away ? TEAMS_BY_ID[myMatchup.away] : null
                    const theirHome = theirMatchup.home ? TEAMS_BY_ID[theirMatchup.home] : null
                    const theirAway = theirMatchup.away ? TEAMS_BY_ID[theirMatchup.away] : null

                    return (
                      <div key={m.matchNumber} className="px-2 sm:px-4 py-2.5">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-[10px] font-mono text-gray-400 w-6 flex-shrink-0">P{m.matchNumber}</span>

                          {/* My side */}
                          <div className="flex-1 min-w-0">
                            {(myHome || myAway) && (
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className="text-[10px] font-body text-gray-400 truncate">
                                  {myHome ? `${myHome.flag_emoji} ${myHome.code}` : '?'} vs {myAway ? `${myAway.flag_emoji} ${myAway.code}` : '?'}
                                </span>
                              </div>
                            )}
                            {myWinner ? (
                              <span className={cn('text-xs font-body font-semibold', sameWinner ? 'text-[#3CAC3B]' : 'text-gray-700 dark:text-gray-300')}>
                                🏆 {myWinner.flag_emoji} {myWinner.code}
                              </span>
                            ) : <span className="text-xs text-gray-300">—</span>}
                          </div>

                          <span className={cn('text-[10px] w-6 text-center flex-shrink-0', sameWinner ? 'text-[#3CAC3B]' : 'text-gray-300 dark:text-gray-600')}>{sameWinner ? '✓' : '≠'}</span>

                          {/* Their side */}
                          <div className="flex-1 min-w-0 text-right">
                            {(theirHome || theirAway) && (
                              <div className="flex items-center gap-1 justify-end mb-0.5">
                                <span className="text-[10px] font-body text-gray-400 truncate">
                                  {theirHome ? `${theirHome.flag_emoji} ${theirHome.code}` : '?'} vs {theirAway ? `${theirAway.flag_emoji} ${theirAway.code}` : '?'}
                                </span>
                              </div>
                            )}
                            {theirWinner ? (
                              <span className={cn('text-xs font-body font-semibold', sameWinner ? 'text-[#3CAC3B]' : 'text-gray-700 dark:text-gray-300')}>
                                🏆 {theirWinner.flag_emoji} {theirWinner.code}
                              </span>
                            ) : <span className="text-xs text-gray-300">—</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
