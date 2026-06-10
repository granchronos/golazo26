'use client'

import { useMemo } from 'react'
import { Trophy, Medal, Award, Zap } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { TEAMS } from '@/lib/constants/teams'
import type { TeamData } from '@/lib/constants/teams'

const TEAMS_BY_ID: Record<string, TeamData> = Object.fromEntries(TEAMS.map((t) => [t.id, t]))

interface BetSummaryProps {
  knockoutPredictions: Record<number, string>
  allMembersPredictions?: Record<string, { name: string; champion: string | null; runnerUp: string | null }>
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

  const predictedChampionTeam = predictedChampionId ? TEAMS_BY_ID[predictedChampionId] : null

  if (!champion && !predictedChampionId && !predictedGoleador) return null

  return (
    <div className="glass-card overflow-hidden">
      {/* ── Champion & Runner-up — podium style centered ── */}
      {champion && (
        <div className="relative bg-gradient-to-r from-[#C9A84C]/5 via-[#C9A84C]/10 to-[#C9A84C]/5 dark:from-[#C9A84C]/[0.06] dark:via-[#C9A84C]/10 dark:to-[#C9A84C]/[0.06]">
          {/* Decorative shimmer */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#C9A84C]/10 rounded-full blur-3xl" />
          </div>

          <div className="relative flex items-center justify-center gap-6 sm:gap-10 py-5 px-4">
            {/* Runner-up — left, slightly smaller */}
            {runnerUp ? (
              <div className="flex flex-col items-center gap-1 opacity-80">
                <Medal size={14} className="text-gray-400 dark:text-gray-500" />
                <span className="text-3xl sm:text-4xl leading-none">{runnerUp.flag_emoji}</span>
                <span className="text-xs font-body font-medium text-gray-500 dark:text-gray-400">{runnerUp.name}</span>
                <span className="text-[9px] font-mono text-gray-400 uppercase">Subcampeón</span>
              </div>
            ) : (
              <div className="w-16" />
            )}

            {/* Champion — center, prominent */}
            <div className="flex flex-col items-center gap-1.5 relative">
              <div className="absolute -top-2 -left-4 -right-4 -bottom-2 bg-[#C9A84C]/[0.08] rounded-2xl blur-md" />
              <Trophy size={20} className="text-[#C9A84C] relative z-10" />
              <span className="text-5xl sm:text-6xl leading-none relative z-10">{champion.flag_emoji}</span>
              <span className="text-sm sm:text-base font-display font-bold text-[#C9A84C] relative z-10">{champion.name}</span>
              <span className="text-[9px] font-mono text-[#C9A84C]/70 uppercase tracking-wider relative z-10">Mi Campeón del Bracket</span>
            </div>

            {/* Runner-up placeholder — right, mirror */}
            {runnerUp ? (
              <div className="flex flex-col items-center gap-1 opacity-0 pointer-events-none">
                <Medal size={14} />
                <span className="text-3xl sm:text-4xl leading-none">{runnerUp.flag_emoji}</span>
                <span className="text-xs font-body">{runnerUp.name}</span>
                <span className="text-[9px]">Subcampeón</span>
              </div>
            ) : (
              <div className="w-16" />
            )}
          </div>
        </div>
      )}

      {/* ── Special picks — Mi Campeón & Goleador ── */}
      {(predictedChampionId || predictedGoleador) && (
        <div className={cn(
          'flex flex-col sm:flex-row sm:items-stretch divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-white/[0.06]',
          champion && 'border-t border-gray-100 dark:border-white/[0.06]'
        )}>
          {predictedChampionTeam && (
            <div className="flex items-center gap-3 px-4 py-3 flex-1">
              <div className="w-8 h-8 rounded-full bg-[#C9A84C]/10 flex items-center justify-center flex-shrink-0">
                <Award size={14} className="text-[#C9A84C]" />
              </div>
              <div>
                <p className="text-[9px] uppercase font-mono text-gray-400 tracking-wider leading-none mb-0.5">Mi Campeón</p>
                <p className="text-sm font-body font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span className="text-base">{predictedChampionTeam.flag_emoji}</span>
                  {predictedChampionTeam.name}
                </p>
              </div>
            </div>
          )}
          {predictedGoleador && (
            <div className="flex items-center gap-3 px-4 py-3 flex-1">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Zap size={14} className="text-amber-500" />
              </div>
              <div>
                <p className="text-[9px] uppercase font-mono text-gray-400 tracking-wider leading-none mb-0.5">Mi Goleador</p>
                <p className="text-sm font-body font-semibold text-gray-900 dark:text-white">
                  ⚽ {predictedGoleador}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── All members' champions ── */}
      {allMembersPredictions && Object.keys(allMembersPredictions).length > 0 && (
        <div className="border-t border-gray-100 dark:border-white/[0.06] px-4 py-3 bg-gray-50/50 dark:bg-white/[0.02]">
          <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wider mb-2">Apuestas de la sala</p>
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
                  <span className="text-sm leading-none">{team?.flag_emoji || '⚽'}</span>
                  <span className="text-gray-600 dark:text-gray-300 truncate max-w-[60px]">{name.split(' ')[0]}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
