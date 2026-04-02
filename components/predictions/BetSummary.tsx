'use client'

import { useMemo } from 'react'
import { Trophy, Medal } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { TEAMS } from '@/lib/constants/teams'
import type { TeamData } from '@/lib/constants/teams'

const TEAMS_BY_ID: Record<string, TeamData> = Object.fromEntries(TEAMS.map((t) => [t.id, t]))

interface BetSummaryProps {
  knockoutPredictions: Record<number, string>
  allMembersPredictions?: Record<string, { name: string; champion: string | null; runnerUp: string | null }>
}

export function BetSummary({ knockoutPredictions, allMembersPredictions }: BetSummaryProps) {
  const champion = knockoutPredictions[103] ? TEAMS_BY_ID[knockoutPredictions[103]] : null

  // Runner up = loser of the final = the team in final that is NOT the champion
  const { semifinal1Winner, semifinal2Winner } = useMemo(() => ({
    semifinal1Winner: knockoutPredictions[101] ? TEAMS_BY_ID[knockoutPredictions[101]] : null,
    semifinal2Winner: knockoutPredictions[102] ? TEAMS_BY_ID[knockoutPredictions[102]] : null,
  }), [knockoutPredictions])

  const runnerUp = useMemo(() => {
    if (!champion || !semifinal1Winner || !semifinal2Winner) return null
    if (champion.id === semifinal1Winner.id) return semifinal2Winner
    if (champion.id === semifinal2Winner.id) return semifinal1Winner
    return null
  }, [champion, semifinal1Winner, semifinal2Winner])

  if (!champion) return null

  return (
    <div className="glass-card p-4 space-y-3">
      {/* My picks */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Trophy size={16} className="text-[#C9A84C] flex-shrink-0" />
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{champion.flag_emoji}</span>
            <span className="text-sm font-body font-semibold text-[#C9A84C]">{champion.name}</span>
          </div>
        </div>
        {runnerUp && (
          <div className="flex items-center gap-2 flex-1">
            <Medal size={16} className="text-gray-400 flex-shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="text-lg">{runnerUp.flag_emoji}</span>
              <span className="text-sm font-body font-medium text-gray-500 dark:text-gray-400">{runnerUp.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* All members champions */}
      {allMembersPredictions && Object.keys(allMembersPredictions).length > 0 && (
        <div className="border-t border-gray-100 dark:border-white/[0.06] pt-3">
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">Campeones de la sala</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(allMembersPredictions).map(([userId, { name, champion: champId }]) => {
              const team = champId ? TEAMS_BY_ID[champId] : null
              return (
                <div
                  key={userId}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-body',
                    team ? 'bg-gray-50 dark:bg-white/[0.04]' : 'bg-gray-50/50 dark:bg-white/[0.02] opacity-50'
                  )}
                >
                  <span className="text-sm">{team?.flag_emoji || '⚽'}</span>
                  <span className="text-gray-500 dark:text-gray-400 truncate max-w-[60px]">{name.split(' ')[0]}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
