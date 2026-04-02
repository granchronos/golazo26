'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import type { TeamData } from '@/lib/constants/teams'

interface BracketMatch {
  id: string
  homeTeam?: TeamData | null
  awayTeam?: TeamData | null
  homeScore?: number | null
  awayScore?: number | null
  winnerId?: string | null
  round: string
}

interface BracketRound {
  label: string
  matches: BracketMatch[]
}

interface BracketViewProps {
  rounds: BracketRound[]
}

function BracketMatchBox({ match }: { match: BracketMatch }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass-card p-2 min-w-[160px] text-xs font-body"
    >
      <div className={cn(
        'flex items-center gap-2 py-1 px-1 rounded',
        match.winnerId === match.homeTeam?.id && 'bg-[#2A398D]/10'
      )}>
        <span className="text-base">{match.homeTeam?.flag_emoji || '🏳️'}</span>
        <span className="flex-1 font-medium truncate dark:text-white">
          {match.homeTeam?.code || 'TBD'}
        </span>
        <span className="font-mono font-bold text-[#2A398D] dark:text-blue-400 w-4 text-center">
          {match.homeScore ?? '-'}
        </span>
      </div>
      <div className="border-t border-gray-100 dark:border-white/10 my-0.5" />
      <div className={cn(
        'flex items-center gap-2 py-1 px-1 rounded',
        match.winnerId === match.awayTeam?.id && 'bg-[#2A398D]/10'
      )}>
        <span className="text-base">{match.awayTeam?.flag_emoji || '🏳️'}</span>
        <span className="flex-1 font-medium truncate dark:text-white">
          {match.awayTeam?.code || 'TBD'}
        </span>
        <span className="font-mono font-bold text-[#2A398D] dark:text-blue-400 w-4 text-center">
          {match.awayScore ?? '-'}
        </span>
      </div>
    </motion.div>
  )
}

export function BracketView({ rounds }: BracketViewProps) {
  if (!rounds.length) {
    return (
      <div className="text-center py-20 text-gray-400 font-body">
        El bracket se activará cuando terminen los grupos
      </div>
    )
  }

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-8 min-w-max py-6 px-4">
        {rounds.map((round, rIdx) => (
          <div key={round.label} className="flex flex-col justify-around gap-4">
            {/* Round label */}
            <div className="text-center mb-2">
              <span className="font-display text-lg tracking-wide gradient-text">{round.label}</span>
            </div>

            {/* Matches */}
            <div
              className="flex flex-col"
              style={{ gap: `${Math.pow(2, rIdx) * 20}px` }}
            >
              {round.matches.map((match) => (
                <div key={match.id} className="relative">
                  <BracketMatchBox match={match} />
                  {/* Connector line — visual only */}
                  {rIdx < rounds.length - 1 && (
                    <div className="absolute right-0 top-1/2 w-8 border-t-2 border-dashed border-gray-200 dark:border-white/10 translate-x-full" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
