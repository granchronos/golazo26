'use client'

import { useMemo } from 'react'
import { Trophy, Users, BarChart2, MapPin, Calendar, Zap } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { TEAMS, GROUP_LETTERS as GL } from '@/lib/constants/teams'
import type { TeamData } from '@/lib/constants/teams'
import type { GroupLetter } from '@/types/database'

const TEAMS_BY_ID: Record<string, TeamData> = Object.fromEntries(TEAMS.map((t) => [t.id, t]))
const GROUP_LETTERS: GroupLetter[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

// ─── Types ───────────────────────────────────────────────────────────

interface RoomRanking {
  roomId: string
  roomName: string
  members: { userId: string; name: string; points: number; isMe: boolean }[]
}

interface MatchInfo {
  status: 'scheduled' | 'live' | 'finished' | 'postponed'
  round: string
  home_team_id: string | null
  away_team_id: string | null
  home_score: number | null
  away_score: number | null
}

interface DashboardProps {
  userName: string
  currentUserId: string
  roomRankings: RoomRanking[]
  matches: MatchInfo[]
  countdown: { days: number; hours: number } | null
}

// ─── Dashboard ───────────────────────────────────────────────────────

export function Dashboard({ userName, currentUserId, roomRankings, matches, countdown }: DashboardProps) {
  const stats = useMemo(() => {
    const total = matches.length
    const finished = matches.filter((m) => m.status === 'finished').length
    const live = matches.filter((m) => m.status === 'live').length
    const groupMatches = matches.filter((m) => m.round === 'group')
    const groupFinished = groupMatches.filter((m) => m.status === 'finished').length
    const knockoutMatches = matches.filter((m) => m.round !== 'group')
    const knockoutFinished = knockoutMatches.filter((m) => m.status === 'finished').length

    // Current phase
    let currentPhase = 'Fase de Grupos'
    if (knockoutFinished > 0) {
      const rounds = ['round_of_32', 'round_of_16', 'quarter_finals', 'semi_finals', 'final']
      const labels: Record<string, string> = {
        round_of_32: 'Ronda de 32',
        round_of_16: 'Octavos de Final',
        quarter_finals: 'Cuartos de Final',
        semi_finals: 'Semifinales',
        final: 'Gran Final',
      }
      for (const r of rounds.reverse()) {
        if (matches.some((m) => m.round === r && (m.status === 'live' || m.status === 'finished'))) {
          currentPhase = labels[r] ?? r
          break
        }
      }
    }

    return { total, finished, live, groupFinished, groupTotal: groupMatches.length, knockoutFinished, knockoutTotal: knockoutMatches.length, currentPhase }
  }, [matches])

  // Group standings from finished matches
  const groupStandings = useMemo(() => {
    const standings: Record<string, { teamId: string; pts: number; gd: number }[]> = {}
    for (const letter of GROUP_LETTERS) {
      const groupTeams = TEAMS.filter((t) => t.group_letter === letter)
      const teamStats: Record<string, { pts: number; gf: number; ga: number }> = {}
      for (const t of groupTeams) teamStats[t.id] = { pts: 0, gf: 0, ga: 0 }

      for (const m of matches.filter((m) => m.round === 'group' && m.status === 'finished')) {
        if (!m.home_team_id || !m.away_team_id || m.home_score == null || m.away_score == null) continue
        const ht = TEAMS_BY_ID[m.home_team_id]
        const at = TEAMS_BY_ID[m.away_team_id]
        if (!ht || !at || ht.group_letter !== letter) continue
        if (!teamStats[ht.id] || !teamStats[at.id]) continue

        teamStats[ht.id].gf += m.home_score
        teamStats[ht.id].ga += m.away_score
        teamStats[at.id].gf += m.away_score
        teamStats[at.id].ga += m.home_score

        if (m.home_score > m.away_score) {
          teamStats[ht.id].pts += 3
        } else if (m.home_score < m.away_score) {
          teamStats[at.id].pts += 3
        } else {
          teamStats[ht.id].pts += 1
          teamStats[at.id].pts += 1
        }
      }

      standings[letter] = Object.entries(teamStats)
        .map(([teamId, s]) => ({ teamId, pts: s.pts, gd: s.gf - s.ga }))
        .sort((a, b) => b.pts - a.pts || b.gd - a.gd)
    }
    return standings
  }, [matches])

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Calendar size={16} className="text-[#2A398D]" />}
          label={stats.currentPhase}
          value={countdown ? `${countdown.days}d ${countdown.hours}h` : stats.live > 0 ? 'EN VIVO' : `${stats.finished}/${stats.total}`}
          accent={stats.live > 0 ? 'live' : 'default'}
        />
        <StatCard
          icon={<Zap size={16} className="text-[#C9A84C]" />}
          label="Partidos jugados"
          value={`${stats.finished}`}
          sub={`de ${stats.total}`}
        />
        <StatCard
          icon={<MapPin size={16} className="text-[#3CAC3B]" />}
          label="Grupos"
          value={`${stats.groupFinished}`}
          sub={`de ${stats.groupTotal}`}
        />
        <StatCard
          icon={<Trophy size={16} className="text-[#E61D25]" />}
          label="Eliminación"
          value={`${stats.knockoutFinished}`}
          sub={`de ${stats.knockoutTotal}`}
        />
      </div>

      {/* Room Rankings */}
      {roomRankings.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-lg dark:text-white flex items-center gap-2">
            <BarChart2 size={18} className="text-[#2A398D]" />
            Rankings
          </h2>
          {roomRankings.map((room) => (
            <RoomRankingCard key={room.roomId} room={room} />
          ))}
        </div>
      )}

      {/* Group Standings */}
      {stats.groupFinished > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg dark:text-white flex items-center gap-2">
            <Users size={18} className="text-[#3CAC3B]" />
            Posiciones de Grupos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {GROUP_LETTERS.map((letter) => {
              const teams = groupStandings[letter]
              if (!teams || teams.every((t) => t.pts === 0 && t.gd === 0)) return null
              return <MiniGroupTable key={letter} letter={letter} teams={teams} />
            })}
          </div>
        </div>
      )}

      {/* World Cup hasn't started yet */}
      {stats.finished === 0 && stats.live === 0 && (
        <div className="glass-card p-6 text-center">
          <span className="text-4xl mb-3 block">⚽</span>
          <p className="text-sm font-body text-gray-400">
            El Mundial aún no ha comenzado. ¡Completa tus apuestas antes del inicio!
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, accent = 'default' }: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  accent?: 'default' | 'live'
}) {
  return (
    <div className="glass-card p-3">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-[10px] font-body text-gray-400 uppercase tracking-wider truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          'font-display text-2xl',
          accent === 'live' ? 'text-[#E61D25] animate-pulse' : 'dark:text-white'
        )}>
          {value}
        </span>
        {sub && <span className="text-xs font-body text-gray-400">{sub}</span>}
      </div>
    </div>
  )
}

// ─── Room Ranking Card with bar chart ────────────────────────────────

function RoomRankingCard({ room }: { room: RoomRanking }) {
  const sorted = [...room.members].sort((a, b) => b.points - a.points)
  const maxPoints = Math.max(...sorted.map((m) => m.points), 1)

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
        <span className="text-xs font-display text-gray-500 dark:text-gray-400 uppercase tracking-wide">{room.roomName}</span>
        <span className="text-[10px] font-mono text-gray-400">{sorted.length} miembros</span>
      </div>
      <div className="p-4 space-y-2.5">
        {sorted.map((member, idx) => {
          const barWidth = maxPoints > 0 ? Math.max((member.points / maxPoints) * 100, 2) : 2
          const colors = [
            'from-[#C9A84C] to-[#D4AF37]',  // gold
            'from-gray-400 to-gray-500',      // silver
            'from-amber-600 to-amber-700',    // bronze
            'from-[#2A398D] to-[#3a4da6]',    // blue
            'from-[#3CAC3B] to-[#2d8e2c]',    // green
          ]
          const barColor = colors[Math.min(idx, colors.length - 1)]

          return (
            <div key={member.userId} className="flex items-center gap-3">
              <span className={cn(
                'font-mono text-[10px] w-4 text-center font-bold',
                idx === 0 ? 'text-[#C9A84C]' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-gray-400'
              )}>
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-xs font-body truncate',
                    member.isMe ? 'font-semibold text-[#2A398D] dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                  )}>
                    {member.name.split(' ')[0]}
                    {member.isMe && <span className="text-[10px] text-gray-400 ml-1">(tú)</span>}
                  </span>
                  <span className="font-mono text-xs font-bold text-gray-600 dark:text-gray-300 ml-2 flex-shrink-0">
                    {member.points} pts
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', barColor)}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Mini Group Table ────────────────────────────────────────────────

function MiniGroupTable({ letter, teams }: {
  letter: string
  teams: { teamId: string; pts: number; gd: number }[]
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-3 py-1.5 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06]">
        <span className="text-[10px] font-display text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grupo {letter}</span>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
        {teams.map((t, idx) => {
          const team = TEAMS_BY_ID[t.teamId]
          if (!team) return null
          const qualifies = idx < 2
          return (
            <div key={t.teamId} className={cn(
              'flex items-center gap-1.5 px-3 py-1.5',
              qualifies && 'bg-[#3CAC3B]/5'
            )}>
              <span className="text-[10px] font-mono text-gray-400 w-3">{idx + 1}</span>
              <span className="text-sm flex-shrink-0">{team.flag_emoji}</span>
              <span className={cn(
                'text-[11px] font-body truncate flex-1',
                qualifies ? 'font-semibold text-[#3CAC3B]' : 'text-gray-500 dark:text-gray-400'
              )}>
                {team.code}
              </span>
              <span className="text-[10px] font-mono font-bold text-gray-600 dark:text-gray-300">{t.pts}</span>
              <span className={cn(
                'text-[9px] font-mono w-6 text-right',
                t.gd > 0 ? 'text-[#3CAC3B]' : t.gd < 0 ? 'text-[#E61D25]' : 'text-gray-400'
              )}>
                {t.gd > 0 ? `+${t.gd}` : t.gd}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
