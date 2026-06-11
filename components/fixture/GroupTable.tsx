'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { WCBadge } from '@/components/ui/WCBadge'
import { TeamFlag } from '@/components/ui/TeamFlag'
import type { GroupLetter } from '@/types/database'
import type { TeamData } from '@/lib/constants/teams'

interface GroupStanding {
  team: TeamData
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  points: number
}

interface GroupTableProps {
  groupLetter: GroupLetter
  teams: TeamData[]
  standings?: GroupStanding[]
  compact?: boolean
}

function defaultStandings(teams: TeamData[]): GroupStanding[] {
  return teams.map((team) => ({
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    points: 0,
  }))
}

export function GroupTable({ groupLetter, teams, standings, compact = false }: GroupTableProps) {
  const rows = standings || defaultStandings(teams)

  const sorted = [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const gdB = b.gf - b.ga
    const gdA = a.gf - a.ga
    if (gdB !== gdA) return gdB - gdA
    return b.gf - a.gf
  })

  return (
    <div className="glass-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-3 py-1.5 bg-gradient-to-r from-[#2A398D] to-[#2A398D]/80">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg text-white tracking-wider">Grupo {groupLetter}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-body">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/10">
              <th className="text-left px-3 py-1 text-gray-500 font-medium w-8">#</th>
              <th className="text-left px-1.5 py-1 text-gray-500 font-medium">Equipo</th>
              {!compact && (
                <>
                  <th className="text-center px-1 py-1 text-gray-500 font-medium w-10">FIFA</th>
                  <th className="text-center px-1 py-1 text-gray-500 font-medium w-6">J</th>
                  <th className="text-center px-1 py-1 text-gray-500 font-medium w-6">G</th>
                  <th className="text-center px-1 py-1 text-gray-500 font-medium w-6">E</th>
                  <th className="text-center px-1 py-1 text-gray-500 font-medium w-6">P</th>
                  <th className="text-center px-1 py-1 text-gray-500 font-medium w-10">DG</th>
                </>
              )}
              <th className="text-center px-3 py-1 text-gray-500 font-medium w-8">Pts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => (
              <motion.tr
                key={row.team.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  'border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors',
                  idx < 2 && 'bg-[#3CAC3B]/5'
                )}
              >
                <td className="px-3 py-1.5">
                  <span className={cn(
                    'w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px] font-bold',
                    idx < 2 ? 'bg-[#3CAC3B] text-white' : 'text-gray-400'
                  )}>
                    {idx + 1}
                  </span>
                </td>
                <td className="px-1.5 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <TeamFlag flagCode={row.team.flag_code} name={row.team.name} size={16} />
                    <span className="font-medium dark:text-white truncate max-w-[95px]" title={row.team.name}>
                      {compact ? row.team.code : row.team.name}
                    </span>
                    <WCBadge teamId={row.team.id} size="xs" />
                  </div>
                </td>
                {!compact && (
                  <>
                    <td className="text-center px-1 py-1.5 text-gray-400 font-mono text-[10px]">#{row.team.fifa_ranking}</td>
                    <td className="text-center px-1 py-1.5 text-gray-600 dark:text-gray-400">{row.played}</td>
                    <td className="text-center px-1 py-1.5 text-gray-600 dark:text-gray-400">{row.won}</td>
                    <td className="text-center px-1 py-1.5 text-gray-600 dark:text-gray-400">{row.drawn}</td>
                    <td className="text-center px-1 py-1.5 text-gray-600 dark:text-gray-400">{row.lost}</td>
                    <td className="text-center px-1 py-1.5 text-gray-600 dark:text-gray-400">
                      {row.gf - row.ga > 0 ? '+' : ''}{row.gf - row.ga}
                    </td>
                  </>
                )}
                <td className="text-center px-3 py-1.5">
                  <span className={cn(
                    'font-mono font-bold text-sm',
                    idx < 2 ? 'text-[#2A398D] dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                  )}>
                    {row.points}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-3 py-1 border-t border-gray-50 dark:border-white/5 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#3CAC3B]" />
          <span className="text-[10px] text-gray-400 font-body">Clasifica</span>
        </div>
      </div>
    </div>
  )
}
