'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/animations/PageTransition'
import { GROUP_LETTERS, TEAMS_BY_GROUP, TEAMS_BY_ID } from '@/lib/constants/teams'
import { GROUP_STAGE_MATCHES } from '@/lib/constants/fixture'
import { cn } from '@/lib/utils/cn'
import { MapPin, ChevronRight } from 'lucide-react'
import { WCBadge } from '@/components/ui/WCBadge'
import { TeamFlag } from '@/components/ui/TeamFlag'
import { WCHistory } from '@/components/fixture/WCHistory'
import { FixtureBracket } from '@/components/fixture/FixtureBracket'
import { MatchDetailModal } from '@/components/fixture/MatchDetailModal'
import type { GroupLetter } from '@/types/database'
import type { TeamData } from '@/lib/constants/teams'
import type { FixtureMatch } from '@/lib/constants/fixture'

type Tab = 'groups' | 'bracket' | 'calendar'

const TABS: { id: Tab; label: string }[] = [
  { id: 'groups', label: 'Grupos' },
  { id: 'bracket', label: 'Llaves' },
  { id: 'calendar', label: 'Calendario' },
]

// ─── Client-only date/time formatting (uses browser local timezone) ───

function useIsMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

function formatMatchDateLabel(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatMatchTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatGroupDateLabel(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function groupMatchesByDate(matches: typeof GROUP_STAGE_MATCHES) {
  const groups: Record<string, typeof GROUP_STAGE_MATCHES> = {}
  for (const m of matches) {
    const key = formatGroupDateLabel(m.match_date)
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  }
  return groups
}

// ─── Group standings computation from DB matches ─────────────────────

interface GroupStanding {
  team: TeamData
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
}

interface DBMatch {
  match_number: number
  home_team_id: string
  away_team_id: string
  home_score: number | null
  away_score: number | null
  status: string
}

function computeGroupStandings(
  groupLetter: GroupLetter,
  teams: TeamData[],
  dbMatches: DBMatch[]
): GroupStanding[] {
  const stats: Record<string, GroupStanding> = {}
  const teamIds = new Set(teams.map((t) => t.id))
  for (const t of teams) {
    stats[t.id] = { team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }
  }

  // Filter to group matches: both teams must belong to this group + finished with scores
  const groupMatches = dbMatches.filter(
    (m) => teamIds.has(m.home_team_id) && teamIds.has(m.away_team_id) &&
           m.status === 'finished' && m.home_score != null && m.away_score != null
  )

  for (const m of groupMatches) {
    const home = stats[m.home_team_id]
    const away = stats[m.away_team_id]
    if (!home || !away) continue

    const hs = m.home_score!
    const as_ = m.away_score!

    home.played++
    away.played++
    home.gf += hs
    home.ga += as_
    away.gf += as_
    away.ga += hs

    if (hs > as_) {
      home.won++
      home.points += 3
      away.lost++
    } else if (as_ > hs) {
      away.won++
      away.points += 3
      home.lost++
    } else {
      home.drawn++
      away.drawn++
      home.points += 1
      away.points += 1
    }
  }

  // Calculate GD and sort
  const standings = Object.values(stats).map((s) => ({ ...s, gd: s.gf - s.ga }))
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.gd !== a.gd) return b.gd - a.gd
    return b.gf - a.gf
  })
  return standings
}

export default function FixturePage() {
  const [activeTab, setActiveTab] = useState<Tab>('groups')
  const [groupFilter, setGroupFilter] = useState<GroupLetter | 'all'>('all')
  const [selectedMatch, setSelectedMatch] = useState<FixtureMatch | null>(null)
  const [dbMatches, setDbMatches] = useState<DBMatch[]>([])
  const mounted = useIsMounted()

  // Fetch real match data from DB
  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await fetch('/api/matches')
        const data = await res.json()
        if (data.matches) setDbMatches(data.matches)
      } catch (err) {
        console.error('Error fetching live scores:', err)
      }
    }
    fetchMatches()
    // Refresh every 60 seconds
    const interval = setInterval(fetchMatches, 60000)
    return () => clearInterval(interval)
  }, [])

  // Create a map of dbMatches by match_number for quick lookup
  const dbMatchMap = useMemo(() => {
    const map: Record<number, DBMatch> = {}
    for (const m of dbMatches) {
      map[m.match_number] = m
    }
    return map
  }, [dbMatches])

  const filteredMatches = useMemo(() => {
    const matches = groupFilter === 'all'
      ? GROUP_STAGE_MATCHES
      : GROUP_STAGE_MATCHES.filter(m => m.group_letter === groupFilter)
    return [...matches].sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
  }, [groupFilter])

  const matchesByDate = useMemo(() => {
    if (!mounted) return {}
    return groupMatchesByDate(filteredMatches)
  }, [filteredMatches, mounted])

  return (
    <PageTransition>
      <div className="mb-6">
        <p className="text-sm text-gray-400 font-body mb-1">11 Jun – 19 Jul 2026</p>
        <h1 className="font-display text-3xl md:text-4xl dark:text-white">Fixture</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/[0.04] rounded-xl mb-6 max-w-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative flex-1 py-2 px-3 text-sm font-body font-medium rounded-lg transition-colors',
              activeTab === tab.id
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-bg"
                className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm"
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Groups tab */}
      {activeTab === 'groups' && (
        <div className="flex flex-col xl:flex-row gap-4">
          {/* Groups grid */}
          <div className="flex-1">
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3">
          {GROUP_LETTERS.map((letter) => {
            const teams = TEAMS_BY_GROUP[letter] || []
            const standings = computeGroupStandings(letter, teams, dbMatches)
            const hasPlayed = standings.some((s) => s.played > 0)

            return (
              <StaggerItem key={letter}>
                <div className="glass-card overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
                    <span className="font-display text-sm text-gray-900 dark:text-white">Grupo {letter}</span>
                    {hasPlayed && (
                      <div className="flex items-center gap-3 text-[9px] font-mono text-gray-400">
                        <span className="w-6 text-center">Pts</span>
                        <span className="w-6 text-center">DG</span>
                        <span className="w-4 text-center">J</span>
                      </div>
                    )}
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                    {standings.map((row, idx) => (
                      <div key={row.team.id} className={cn(
                        'flex items-center gap-3 px-4 py-2.5',
                        idx < 2 && 'bg-[#3CAC3B]/[0.04]'
                      )}>
                        <span className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                          idx < 2 ? 'bg-[#3CAC3B] text-white' : 'text-gray-300 dark:text-gray-600'
                        )}>
                          {idx + 1}
                        </span>
                        <TeamFlag flagCode={row.team.flag_code} name={row.team.name} size={24} />
                        <span className="text-sm font-body text-gray-800 dark:text-gray-200 flex-1 min-w-0 truncate">{row.team.name}</span>
                        <span className="text-[9px] font-mono text-gray-400 flex-shrink-0">#{row.team.fifa_ranking}</span>
                        <WCBadge teamId={row.team.id} size="xs" />
                        {hasPlayed ? (
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={cn(
                              'w-6 text-center font-mono text-xs font-bold',
                              idx < 2 ? 'text-[#2A398D] dark:text-blue-400' : 'text-gray-500'
                            )}>
                              {row.points}
                            </span>
                            <span className={cn(
                              'w-6 text-center font-mono text-[10px]',
                              row.gd > 0 ? 'text-emerald-500' : row.gd < 0 ? 'text-red-400' : 'text-gray-400'
                            )}>
                              {row.gd > 0 ? '+' : ''}{row.gd}
                            </span>
                            <span className="w-4 text-center font-mono text-[10px] text-gray-400">
                              {row.played}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </StaggerItem>
            )
          })}
            </StaggerContainer>
          </div>

          {/* WC History sidebar */}
          <div className="xl:w-80 flex-shrink-0">
            <WCHistory />
          </div>
        </div>
      )}

      {/* Bracket tab */}
      {activeTab === 'bracket' && (
        <FixtureBracket />
      )}

      {/* Calendar tab */}
      {activeTab === 'calendar' && (
        <div>
          {/* Group filter chips */}
          <div className="flex gap-1.5 flex-wrap mb-5">
            <button
              onClick={() => setGroupFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-colors',
                groupFilter === 'all'
                  ? 'bg-[#2A398D] text-white'
                  : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              Todos
            </button>
            {GROUP_LETTERS.map((letter) => (
              <button
                key={letter}
                onClick={() => setGroupFilter(letter)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-colors',
                  groupFilter === letter
                    ? 'bg-[#2A398D] text-white'
                    : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Matches grouped by date */}
          <div className="space-y-6">
            {mounted && Object.entries(matchesByDate).map(([dateLabel, matches]) => (
              <div key={dateLabel}>
                <p className="text-xs font-body font-medium text-gray-400 uppercase tracking-wider mb-2 sticky top-0 bg-[var(--bg-primary)] py-1 z-10">
                  {dateLabel}
                </p>
                <div className="space-y-1.5">
                  {matches.map((m) => {
                    const home = m.home_team_id ? TEAMS_BY_ID[m.home_team_id] : null
                    const away = m.away_team_id ? TEAMS_BY_ID[m.away_team_id] : null
                    const dbMatch = dbMatchMap[m.match_number]
                    const isLive = dbMatch?.status === 'live'
                    const isFinished = dbMatch?.status === 'finished'
                    const hasScore = dbMatch && dbMatch.home_score != null && dbMatch.away_score != null
                    
                    return (
                      <button
                        key={m.match_number}
                        onClick={() => home && away ? setSelectedMatch(m) : undefined}
                        className={cn(
                          'glass-card flex items-center gap-3 px-4 py-3 w-full text-left transition-colors',
                          home && away && 'hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer',
                          isLive && 'ring-1 ring-red-500/30 bg-red-50/30 dark:bg-red-950/10'
                        )}
                      >
                        {/* Time or Status */}
                        <span className={cn(
                          'font-mono text-xs w-10 flex-shrink-0 text-center',
                          isLive ? 'text-red-500 font-bold' : isFinished ? 'text-gray-400' : 'text-gray-400'
                        )}>
                          {isLive ? (
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              <span className="text-[10px]">LIVE</span>
                            </span>
                          ) : isFinished ? (
                            <span className="text-[10px] text-gray-400">FIN</span>
                          ) : (
                            formatMatchTime(m.match_date)
                          )}
                        </span>
                        {/* Group badge */}
                        <span className="text-[10px] font-body font-semibold text-[#2A398D] dark:text-blue-400 bg-[#2A398D]/[0.08] dark:bg-[#2A398D]/20 px-1.5 py-0.5 rounded flex-shrink-0">
                          {m.group_letter}
                        </span>
                        {/* Teams + Score */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {home && <TeamFlag flagCode={home.flag_code} name={home.name} size={18} />}
                          <span className={cn(
                            'text-sm font-body font-medium',
                            isFinished && dbMatch?.home_score != null && dbMatch?.away_score != null && dbMatch.home_score > dbMatch.away_score
                              ? 'text-[#2A398D] dark:text-blue-400 font-bold'
                              : 'text-gray-800 dark:text-gray-200'
                          )}>
                            {home?.code}
                          </span>
                          
                          {/* Score or VS */}
                          {hasScore ? (
                            <span className={cn(
                              'font-mono text-sm font-bold px-1.5',
                              isLive ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'
                            )}>
                              {dbMatch.home_score} - {dbMatch.away_score}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300 dark:text-gray-600 mx-1">vs</span>
                          )}

                          <span className={cn(
                            'text-sm font-body font-medium',
                            isFinished && dbMatch?.home_score != null && dbMatch?.away_score != null && dbMatch.away_score > dbMatch.home_score
                              ? 'text-[#2A398D] dark:text-blue-400 font-bold'
                              : 'text-gray-800 dark:text-gray-200'
                          )}>
                            {away?.code}
                          </span>
                          {away && <TeamFlag flagCode={away.flag_code} name={away.name} size={18} />}
                        </div>
                        {/* Time (show when finished/live) */}
                        {(isLive || isFinished) && (
                          <span className="hidden sm:block text-[10px] font-mono text-gray-400 flex-shrink-0">
                            {formatMatchTime(m.match_date)}
                          </span>
                        )}
                        {/* Venue */}
                        <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 font-body flex-shrink-0">
                          <MapPin size={10} />
                          <span className="truncate max-w-[140px]">{m.city}</span>
                        </div>
                        {/* Arrow hint */}
                        {home && away && (
                          <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Match detail modal */}
          {selectedMatch && selectedMatch.home_team_id && selectedMatch.away_team_id && (
            <MatchDetailModal
              open={!!selectedMatch}
              onClose={() => setSelectedMatch(null)}
              home={TEAMS_BY_ID[selectedMatch.home_team_id]}
              away={TEAMS_BY_ID[selectedMatch.away_team_id]}
              matchDate={selectedMatch.match_date}
              venue={selectedMatch.venue}
              city={selectedMatch.city}
              groupLetter={selectedMatch.group_letter ?? ''}
            />
          )}
        </div>
      )}
    </PageTransition>
  )
}
