'use client'

import { useState, useMemo } from 'react'
import { GitCompareArrows } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { TEAMS, GROUP_LETTERS } from '@/lib/constants/teams'
import { BRACKET_ROUNDS } from '@/lib/constants/bracket'
import type { TeamData } from '@/lib/constants/teams'
import type { GroupLetter, GroupPrediction } from '@/types/database'

const TEAMS_BY_ID: Record<string, TeamData> = Object.fromEntries(TEAMS.map((t) => [t.id, t]))

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

  const completedMembers = allMembers.filter((m) => m.isComplete && m.userId !== currentUserId)

  if (!me?.isComplete) {
    return (
      <div className="glass-card p-6 text-center">
        <GitCompareArrows size={24} className="mx-auto mb-2 text-gray-300 dark:text-white/10" />
        <p className="text-sm font-body text-gray-400">
          Completa todas tus apuestas para comparar con otros miembros
        </p>
      </div>
    )
  }

  if (completedMembers.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <GitCompareArrows size={24} className="mx-auto mb-2 text-gray-300 dark:text-white/10" />
        <p className="text-sm font-body text-gray-400">
          Ningún otro miembro ha completado sus apuestas
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Member selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-body text-gray-400">Comparar con:</span>
        {completedMembers.map((m) => (
          <button
            key={m.userId}
            onClick={() => setCompareWith(m.userId === compareWith ? null : m.userId)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-colors',
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
          {/* Groups comparison */}
          <div className="glass-card overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06]">
              <span className="text-xs font-display text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fase de Grupos</span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {GROUP_LETTERS.map((letter) => {
                const myPred = me.groupPredictions[letter]
                const theirPred = other.groupPredictions[letter]
                if (!myPred || !theirPred) return null
                const same1st = myPred.team_1st_id === theirPred.team_1st_id
                const same2nd = myPred.team_2nd_id === theirPred.team_2nd_id
                const my1st = TEAMS_BY_ID[myPred.team_1st_id]
                const my2nd = TEAMS_BY_ID[myPred.team_2nd_id]
                const their1st = TEAMS_BY_ID[theirPred.team_1st_id]
                const their2nd = TEAMS_BY_ID[theirPred.team_2nd_id]
                return (
                  <div key={letter} className="flex items-center px-4 py-2 gap-2">
                    <span className="text-[10px] font-mono text-gray-400 w-4">{letter}</span>
                    <div className="flex-1 flex items-center gap-1">
                      <span className={cn('text-xs', same1st && 'text-[#3CAC3B] font-semibold')}>
                        {my1st?.flag_emoji} {my1st?.code}
                      </span>
                      <span className="text-gray-300 dark:text-gray-600">/</span>
                      <span className={cn('text-xs', same2nd && 'text-[#3CAC3B] font-semibold')}>
                        {my2nd?.flag_emoji} {my2nd?.code}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-300 dark:text-gray-600">vs</span>
                    <div className="flex-1 flex items-center gap-1 justify-end">
                      <span className={cn('text-xs', same1st && 'text-[#3CAC3B] font-semibold')}>
                        {their1st?.flag_emoji} {their1st?.code}
                      </span>
                      <span className="text-gray-300 dark:text-gray-600">/</span>
                      <span className={cn('text-xs', same2nd && 'text-[#3CAC3B] font-semibold')}>
                        {their2nd?.flag_emoji} {their2nd?.code}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Knockout comparison */}
          {BRACKET_ROUNDS.map((round) => {
            const diffs = round.matches.filter((m) => {
              const myPick = me.knockoutPredictions[m.matchNumber]
              const theirPick = other.knockoutPredictions[m.matchNumber]
              return myPick && theirPick
            })
            if (diffs.length === 0) return null
            return (
              <div key={round.id} className="glass-card overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06]">
                  <span className="text-xs font-display text-gray-500 dark:text-gray-400 uppercase tracking-wide">{round.label}</span>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                  {diffs.map((m) => {
                    const myTeam = TEAMS_BY_ID[me.knockoutPredictions[m.matchNumber]]
                    const theirTeam = TEAMS_BY_ID[other.knockoutPredictions[m.matchNumber]]
                    const same = myTeam?.id === theirTeam?.id
                    return (
                      <div key={m.matchNumber} className="flex items-center px-4 py-2 gap-2">
                        <span className="text-[10px] font-mono text-gray-400 w-7">P{m.matchNumber}</span>
                        <div className="flex-1 flex items-center gap-1">
                          <span className={cn('text-xs font-body', same ? 'text-[#3CAC3B] font-semibold' : 'text-gray-700 dark:text-gray-300')}>
                            {myTeam?.flag_emoji} {myTeam?.code}
                          </span>
                        </div>
                        <span className={cn('text-[10px]', same ? 'text-[#3CAC3B]' : 'text-gray-300 dark:text-gray-600')}>
                          {same ? '=' : '≠'}
                        </span>
                        <div className="flex-1 flex items-center gap-1 justify-end">
                          <span className={cn('text-xs font-body', same ? 'text-[#3CAC3B] font-semibold' : 'text-gray-700 dark:text-gray-300')}>
                            {theirTeam?.flag_emoji} {theirTeam?.code}
                          </span>
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
