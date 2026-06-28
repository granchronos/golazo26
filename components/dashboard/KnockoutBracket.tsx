'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TeamFlag } from '@/components/ui/TeamFlag'
import { TEAMS } from '@/lib/constants/teams'
import { cn } from '@/lib/utils/cn'

interface MatchInfo {
  status: 'scheduled' | 'live' | 'finished' | 'postponed'
  round: string
  home_team_id: string | null
  away_team_id: string | null
  home_score: number | null
  away_score: number | null
}

const ROUNDS = [
  { id: 'round_of_32', label: 'Round of 32' },
  { id: 'round_of_16', label: 'Round of 16' },
  { id: 'quarter_finals', label: 'Quarter-finals' },
  { id: 'semi_finals', label: 'Semi-finals' },
  { id: 'final', label: 'Final' },
]

export function KnockoutBracket({ matches }: { matches: MatchInfo[] }) {
  const [startIndex, setStartIndex] = useState(0)

  const knockoutMatches = useMemo(() => {
    return matches.filter(m => ROUNDS.some(r => r.id === m.round))
  }, [matches])

  if (knockoutMatches.length === 0) return null

  const getMatchesByRound = (roundId: string) => {
    return knockoutMatches.filter(m => m.round === roundId)
  }

  const visibleRounds = ROUNDS.slice(startIndex, startIndex + 3)
  const canGoPrev = startIndex > 0
  const canGoNext = startIndex + 3 < ROUNDS.length

  const getTeam = (id: string | null) => {
    if (!id) return null
    return TEAMS.find(t => t.id === id) || null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg dark:text-white">Knockout</h2>
        <div className="flex items-center gap-2">
          <button 
            disabled={!canGoPrev} 
            onClick={() => setStartIndex(s => s - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 dark:border-white/10 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            disabled={!canGoNext} 
            onClick={() => setStartIndex(s => s + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 dark:border-white/10 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {visibleRounds.map(round => {
          const roundMatches = getMatchesByRound(round.id)
          return (
            <div key={round.id} className="flex-1 min-w-[200px] flex flex-col gap-4">
              <h3 className="text-sm font-body text-center text-gray-500 mb-2">{round.label}</h3>
              {roundMatches.length === 0 ? (
                <div className="text-center text-xs text-gray-400 py-4">Sin partidos</div>
              ) : (
                roundMatches.map((m, i) => {
                  const home = getTeam(m.home_team_id)
                  const away = getTeam(m.away_team_id)
                  return (
                    <div key={i} className="glass-card rounded-lg overflow-hidden border border-gray-100 dark:border-white/5">
                      <div className="px-3 py-2 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 text-[10px] text-gray-500">
                        {m.status === 'live' ? <span className="text-red-500 font-bold animate-pulse">EN VIVO</span> : m.status === 'finished' ? 'Final' : 'Por definir'}
                      </div>
                      <div className="p-2 space-y-1">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            {home ? <TeamFlag flagCode={home.flag_code} name={home.name} size={14} /> : <div className="w-3.5 h-3.5 bg-gray-200 dark:bg-white/10 rounded-sm" />}
                            <span className="text-xs font-body font-medium">{home?.name || 'TBD'}</span>
                          </div>
                          <span className="text-xs font-mono font-bold">{m.home_score ?? '-'}</span>
                        </div>
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            {away ? <TeamFlag flagCode={away.flag_code} name={away.name} size={14} /> : <div className="w-3.5 h-3.5 bg-gray-200 dark:bg-white/10 rounded-sm" />}
                            <span className="text-xs font-body font-medium">{away?.name || 'TBD'}</span>
                          </div>
                          <span className="text-xs font-mono font-bold">{m.away_score ?? '-'}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
