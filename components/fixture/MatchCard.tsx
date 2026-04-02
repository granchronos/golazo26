'use client'

import { motion } from 'framer-motion'
import { MapPin, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { formatMatchDate } from '@/lib/utils/date'
import type { Match, MatchStatus } from '@/types/database'
import type { TeamData } from '@/lib/constants/teams'

interface MatchCardProps {
  match: Match
  homeTeam?: TeamData | null
  awayTeam?: TeamData | null
  showRound?: boolean
  compact?: boolean
}

const statusConfig: Record<MatchStatus, { label: string; variant: 'blue' | 'red' | 'green' | 'gray' }> = {
  scheduled: { label: 'Programado', variant: 'blue' },
  live: { label: 'EN VIVO', variant: 'red' },
  finished: { label: 'Finalizado', variant: 'gray' },
  postponed: { label: 'Aplazado', variant: 'gray' as const },
}

export function MatchCard({ match, homeTeam, awayTeam, showRound = false, compact = false }: MatchCardProps) {
  const status = statusConfig[match.status]
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass-card p-4 hover:shadow-md transition-shadow"
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-body">
          <Clock size={12} />
          <span>{formatMatchDate(match.match_date)}</span>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            </span>
          )}
          <Badge variant={status.variant as 'blue' | 'red' | 'green' | 'gray'}>
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center gap-3">
        {/* Home Team */}
        <div className={cn('flex-1 flex items-center gap-2', compact ? 'flex-row' : 'flex-col sm:flex-row')}>
          <span className="text-2xl">{homeTeam?.flag_emoji || '🏳️'}</span>
          <span className={cn(
            'font-body font-semibold dark:text-white',
            compact ? 'text-sm' : 'text-sm sm:text-base',
            isFinished && match.winner_id === match.home_team_id && 'text-[#2A398D]'
          )}>
            {compact ? (homeTeam?.code || '???') : (homeTeam?.name || 'Por definir')}
          </span>
        </div>

        {/* Score / VS */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isFinished || isLive ? (
            <div className="flex items-center gap-1">
              <span className={cn(
                'font-mono font-bold text-xl w-8 text-center',
                isFinished && match.winner_id === match.home_team_id && 'text-[#2A398D]'
              )}>
                {match.home_score ?? '-'}
              </span>
              <span className="text-gray-400 font-mono">:</span>
              <span className={cn(
                'font-mono font-bold text-xl w-8 text-center',
                isFinished && match.winner_id === match.away_team_id && 'text-[#2A398D]'
              )}>
                {match.away_score ?? '-'}
              </span>
            </div>
          ) : (
            <span className="text-gray-400 font-body text-sm font-medium px-2">VS</span>
          )}
        </div>

        {/* Away Team */}
        <div className={cn('flex-1 flex items-center justify-end gap-2', compact ? 'flex-row-reverse' : 'flex-col-reverse sm:flex-row-reverse')}>
          <span className="text-2xl">{awayTeam?.flag_emoji || '🏳️'}</span>
          <span className={cn(
            'font-body font-semibold dark:text-white text-right',
            compact ? 'text-sm' : 'text-sm sm:text-base',
            isFinished && match.winner_id === match.away_team_id && 'text-[#2A398D]'
          )}>
            {compact ? (awayTeam?.code || '???') : (awayTeam?.name || 'Por definir')}
          </span>
        </div>
      </div>

      {/* Venue */}
      {!compact && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 font-body">
          <MapPin size={11} />
          <span>{match.city} — {match.venue}</span>
        </div>
      )}
    </motion.div>
  )
}
