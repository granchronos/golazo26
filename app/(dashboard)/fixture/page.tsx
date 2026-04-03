'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/animations/PageTransition'
import { GROUP_LETTERS, TEAMS_BY_GROUP, TEAMS_BY_ID } from '@/lib/constants/teams'
import { GROUP_STAGE_MATCHES } from '@/lib/constants/fixture'
import { cn } from '@/lib/utils/cn'
import { MapPin, ChevronRight } from 'lucide-react'
import { WCBadge } from '@/components/ui/WCBadge'
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

function formatMatchDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatMatchTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function groupMatchesByDate(matches: typeof GROUP_STAGE_MATCHES) {
  const groups: Record<string, typeof GROUP_STAGE_MATCHES> = {}
  for (const m of matches) {
    const key = new Date(m.match_date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  }
  return groups
}

export default function FixturePage() {
  const [activeTab, setActiveTab] = useState<Tab>('groups')
  const [groupFilter, setGroupFilter] = useState<GroupLetter | 'all'>('all')
  const [selectedMatch, setSelectedMatch] = useState<FixtureMatch | null>(null)

  const filteredMatches = useMemo(() => {
    const matches = groupFilter === 'all'
      ? GROUP_STAGE_MATCHES
      : GROUP_STAGE_MATCHES.filter(m => m.group_letter === groupFilter)
    return [...matches].sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
  }, [groupFilter])

  const matchesByDate = useMemo(() => groupMatchesByDate(filteredMatches), [filteredMatches])

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
            return (
              <StaggerItem key={letter}>
                <div className="glass-card overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/[0.06]">
                    <span className="font-display text-sm text-gray-900 dark:text-white">Grupo {letter}</span>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                    {teams.map((team, idx) => (
                      <div key={team.id} className={cn(
                        'flex items-center gap-3 px-4 py-2.5',
                        idx < 2 && 'bg-[#3CAC3B]/[0.04]'
                      )}>
                        <span className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                          idx < 2 ? 'bg-[#3CAC3B] text-white' : 'text-gray-300 dark:text-gray-600'
                        )}>
                          {idx + 1}
                        </span>
                        <span className="text-lg leading-none">{team.flag_emoji}</span>
                        <span className="text-sm font-body text-gray-800 dark:text-gray-200">{team.name}</span>
                        <WCBadge teamId={team.id} size="xs" />
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
            {Object.entries(matchesByDate).map(([dateLabel, matches]) => (
              <div key={dateLabel}>
                <p className="text-xs font-body font-medium text-gray-400 uppercase tracking-wider mb-2 sticky top-0 bg-[var(--bg-primary)] py-1 z-10">
                  {dateLabel}
                </p>
                <div className="space-y-1.5">
                  {matches.map((m) => {
                    const home = m.home_team_id ? TEAMS_BY_ID[m.home_team_id] : null
                    const away = m.away_team_id ? TEAMS_BY_ID[m.away_team_id] : null
                    return (
                      <button
                        key={m.match_number}
                        onClick={() => home && away ? setSelectedMatch(m) : undefined}
                        className={cn(
                          'glass-card flex items-center gap-3 px-4 py-3 w-full text-left transition-colors',
                          home && away && 'hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer'
                        )}
                      >
                        {/* Time */}
                        <span className="font-mono text-xs text-gray-400 w-10 flex-shrink-0">
                          {formatMatchTime(m.match_date)}
                        </span>
                        {/* Group badge */}
                        <span className="text-[10px] font-body font-semibold text-[#2A398D] dark:text-blue-400 bg-[#2A398D]/[0.08] dark:bg-[#2A398D]/20 px-1.5 py-0.5 rounded flex-shrink-0">
                          {m.group_letter}
                        </span>
                        {/* Teams */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-sm leading-none">{home?.flag_emoji}</span>
                          <span className="text-sm font-body font-medium text-gray-800 dark:text-gray-200">{home?.code}</span>
                          <span className="text-xs text-gray-300 dark:text-gray-600 mx-1">vs</span>
                          <span className="text-sm leading-none">{away?.flag_emoji}</span>
                          <span className="text-sm font-body font-medium text-gray-800 dark:text-gray-200">{away?.code}</span>
                        </div>
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
