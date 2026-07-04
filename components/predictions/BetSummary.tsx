'use client'

import { useMemo } from 'react'
import { Trophy, Medal, Award, Zap } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { TeamFlag } from '@/components/ui/TeamFlag'
import { TEAMS, TEAMS_BY_ID } from '@/lib/constants/teams'
import type { TeamData } from '@/lib/constants/teams'

interface BetSummaryProps {
  knockoutPredictions: Record<number, string>
  allMembersPredictions?: Record<
    string,
    { name: string; champion: string | null; runnerUp: string | null }
  >
  predictedChampionId?: string | null
  predictedGoleador?: string
}

export function BetSummary({
  knockoutPredictions,
  allMembersPredictions,
  predictedChampionId = null,
  predictedGoleador = '',
}: BetSummaryProps) {
  const champion = knockoutPredictions[103] ? TEAMS_BY_ID[knockoutPredictions[103]] : null

  // Runner up = loser of the final = the team in final that is NOT the champion
  const { semifinal1Winner, semifinal2Winner } = useMemo(
    () => ({
      semifinal1Winner: knockoutPredictions[101] ? TEAMS_BY_ID[knockoutPredictions[101]] : null,
      semifinal2Winner: knockoutPredictions[102] ? TEAMS_BY_ID[knockoutPredictions[102]] : null,
    }),
    [knockoutPredictions]
  )

  const runnerUp = useMemo(() => {
    if (!champion || !semifinal1Winner || !semifinal2Winner) return null
    if (champion.id === semifinal1Winner.id) return semifinal2Winner
    if (champion.id === semifinal2Winner.id) return semifinal1Winner
    return null
  }, [champion, semifinal1Winner, semifinal2Winner])

  // First try explicit champion pick, then fallback to bracket champion
  const championTeam = predictedChampionId 
    ? TEAMS_BY_ID[predictedChampionId] 
    : champion;

  if (!championTeam && !predictedGoleador && (!allMembersPredictions || Object.keys(allMembersPredictions).length === 0)) return null

  return (
    <div className="glass-card overflow-hidden">
      {(championTeam || predictedGoleador) && (
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
          {championTeam && (
            <div className="flex items-center gap-2">
              <Award size={16} className="text-[#C9A84C]" />
              <span className="text-xs font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                <TeamFlag flagCode={championTeam.flag_code} name={championTeam.name} size={16} />
                {championTeam.name}
              </span>
            </div>
          )}
          {predictedGoleador && (
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-500" />
              <span className="text-xs font-medium text-gray-900 dark:text-white">{predictedGoleador}</span>
            </div>
          )}
        </div>
      )}

      {/* ── All members' champions ── */}
      {allMembersPredictions && Object.keys(allMembersPredictions).length > 0 && (
        <div className="px-4 py-3 bg-gray-50/50 dark:bg-white/[0.02]">
          <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wider mb-2">
            Campeones de la sala
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(allMembersPredictions).map(([userId, { name, champion: champId }]) => {
              const team = champId ? TEAMS_BY_ID[champId] : null
              return (
                <div
                  key={userId}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-body border transition-colors',
                    team
                      ? 'bg-white dark:bg-white/[0.06] border-gray-200 dark:border-white/10'
                      : 'bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/[0.04] opacity-40'
                  )}
                >
                  {team ? (
                    <TeamFlag flagCode={team.flag_code} name={team.name} size={14} />
                  ) : (
                    <span className="text-sm leading-none">⚽</span>
                  )}
                  <span className="text-gray-600 dark:text-gray-300 truncate max-w-[60px]">
                    {name.split(' ')[0]}
                  </span>
                  {team && (
                    <span className="text-[9px] font-mono text-gray-400">#{team.fifa_ranking}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
