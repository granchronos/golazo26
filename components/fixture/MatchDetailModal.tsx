'use client'

import { X, Swords, Clock, MapPin, Star, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { WCBadge } from '@/components/ui/WCBadge'
import { TeamFlag } from '@/components/ui/TeamFlag'
import { WC_HISTORY } from '@/lib/constants/teams'
import { getMatchupData, getFallbackFacts } from '@/lib/constants/matchups'
import type { TeamData } from '@/lib/constants/teams'

interface MatchDetailModalProps {
  open: boolean
  onClose: () => void
  home: TeamData
  away: TeamData
  matchDate: string
  venue: string
  city: string
  groupLetter: string
  events?: any[] | null
}

const BEST_LABELS: Record<string, string> = {
  Final: 'Finalista',
  Semi: 'Semifinalista',
  Cuartos: 'Cuartos de final',
  Octavos: 'Octavos de final',
  Grupos: 'Fase de grupos',
  Debut: 'Debut mundialista',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function TeamProfile({ team, side }: { team: TeamData; side: 'left' | 'right' }) {
  const h = WC_HISTORY[team.id]
  const align = side === 'right' ? 'items-end text-right' : 'items-start text-left'

  return (
    <div className={cn('flex flex-col gap-1', align)}>
      <TeamFlag flagCode={team.flag_code} name={team.name} size={48} />
      <span className="font-display text-sm dark:text-white">{team.name}</span>
      <span className="text-[10px] font-mono text-gray-400">FIFA #{team.fifa_ranking}</span>
      <WCBadge teamId={team.id} size="sm" />
      {h && (
        <div className="mt-1 space-y-0.5">
          {h.titles > 0 ? (
            <p className="text-[10px] font-body text-[#C9A84C]">
              {'★'.repeat(h.titles)} {h.titles} {h.titles === 1 ? 'título' : 'títulos'} mundial{h.titles > 1 ? 'es' : ''}
            </p>
          ) : h.best ? (
            <p className="text-[10px] font-body text-gray-400">
              Máximo logro: {BEST_LABELS[h.best]}
              {h.bestYear ? ` (${h.bestYear})` : ''}
            </p>
          ) : null}
          <p className="text-[9px] font-mono text-gray-400">{team.confederation}</p>
        </div>
      )}
    </div>
  )
}

export function MatchDetailModal({
  open,
  onClose,
  home,
  away,
  matchDate,
  venue,
  city,
  groupLetter,
  events,
}: MatchDetailModalProps) {
  const matchup = getMatchupData(home.id, away.id) ?? getFallbackFacts(home.id, away.id)

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[10%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 max-h-[80vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0f0f1a] border border-gray-200 dark:border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-b from-[#2A398D] to-[#1e2b6e] px-4 py-3 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-body font-semibold text-white/70 bg-white/10 px-2 py-0.5 rounded">
                  Grupo {groupLetter}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X size={14} className="text-white" />
              </button>
            </div>

            {/* Teams face-off */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-start justify-between gap-3">
                <TeamProfile team={home} side="left" />
                <div className="flex flex-col items-center gap-1 pt-4">
                  <Swords size={18} className="text-gray-300 dark:text-gray-600" />
                  <span className="text-[10px] font-mono text-gray-400">VS</span>
                </div>
                <TeamProfile team={away} side="right" />
              </div>
            </div>

            {/* Match info */}
            <div className="mx-4 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.03] flex flex-wrap gap-x-4 gap-y-1">
              <div className="flex items-center gap-1.5">
                <Clock size={11} className="text-gray-400" />
                <span className="text-[10px] font-body text-gray-500">
                  {formatDate(matchDate)} · {formatTime(matchDate)} hrs
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={11} className="text-gray-400" />
                <span className="text-[10px] font-body text-gray-500 truncate">
                  {venue}, {city}
                </span>
              </div>
            </div>

            {/* Live Events Timeline (Goals & Cards) */}
            {events && events.length > 0 && (
              <div className="mx-4 mt-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.01]">
                <div className="flex items-center gap-1.5 mb-2 pb-1 border-b border-gray-100 dark:border-white/5">
                  <Info size={11} className="text-[#2A398D]" />
                  <span className="text-[10px] font-display font-bold text-gray-500 uppercase tracking-wider">
                    Sucesos del Partido
                  </span>
                </div>
                
                <div className="space-y-1 relative py-1">
                  {/* Vertical middle divider line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gray-200/60 dark:bg-white/5 -translate-x-1/2 hidden sm:block" />

                  {events
                    .sort((a: any, b: any) => a.time - b.time)
                    .map((ev: any, i: number) => {
                      const isHome = ev.team_id === home.id;
                      const isGoal = ev.type === 'Goal';
                      const isRedCard = ev.type === 'Card' && (ev.detail?.toLowerCase().includes('red') || ev.detail === 'Yellow-Red Card');
                      const isYellowCard = ev.type === 'Card' && ev.detail?.toLowerCase().includes('yellow') && !isRedCard;

                      const eventIcon = isGoal ? (
                        <span className="text-[10px]" title={ev.detail}>⚽</span>
                      ) : isRedCard ? (
                        <span className="inline-block w-2 h-3 bg-red-500 rounded-[1px] shadow-sm shrink-0" title={ev.detail} />
                      ) : isYellowCard ? (
                        <span className="inline-block w-2 h-3 bg-yellow-400 rounded-[1px] shadow-sm shrink-0" title={ev.detail} />
                      ) : null;

                      if (!eventIcon) return null;

                      return (
                        <div key={i} className={cn(
                          "flex items-center gap-2 text-[11px] font-body py-0.5",
                          isHome ? "justify-start text-left sm:pr-[52%] sm:justify-end sm:text-right" : "justify-end text-right sm:pl-[52%] sm:justify-start sm:text-left"
                        )}>
                          {isHome ? (
                            <>
                              <span className="text-gray-700 dark:text-gray-300">
                                <span className="font-semibold">{ev.player}</span>{' '}
                                <span className="text-gray-400 font-mono text-[9px]">{ev.time}{ev.extra ? `+${ev.extra}` : ''}{"'"}</span>
                                {ev.detail === 'Own Goal' && <span className="text-[9px] text-red-500 ml-1">(AG)</span>}
                                {ev.detail === 'Penalty' && <span className="text-[9px] text-green-500 ml-1">(P)</span>}
                              </span>
                              <span className="flex-shrink-0">{eventIcon}</span>
                            </>
                          ) : (
                            <>
                              <span className="flex-shrink-0">{eventIcon}</span>
                              <span className="text-gray-700 dark:text-gray-300">
                                <span className="font-mono text-[9px] text-gray-400">{ev.time}{ev.extra ? `+${ev.extra}` : ''}{"'"}</span>{' '}
                                <span className="font-semibold">{ev.player}</span>
                                {ev.detail === 'Own Goal' && <span className="text-[9px] text-red-500 ml-1">(AG)</span>}
                                {ev.detail === 'Penalty' && <span className="text-[9px] text-green-500 ml-1">(P)</span>}
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Head-to-head */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-1.5 mb-2">
                <Swords size={12} className="text-[#2A398D]" />
                <span className="text-xs font-display text-gray-800 dark:text-white">
                  Historial mundialista
                </span>
              </div>
              <div className="rounded-lg border border-gray-100 dark:border-white/[0.06] p-3">
                <p className="text-sm font-mono font-bold text-center text-gray-800 dark:text-white mb-1">
                  {matchup.wcMeetings} {matchup.wcMeetings === 1 ? 'enfrentamiento' : 'enfrentamientos'}
                </p>
                {matchup.h2h && (
                  <p className="text-[10px] font-body text-gray-500 text-center leading-relaxed">
                    {matchup.h2h}
                  </p>
                )}
              </div>
            </div>

            {/* Fun facts */}
            {matchup.facts.length > 0 && (
              <div className="px-4 pt-2 pb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Star size={12} className="text-[#C9A84C]" />
                  <span className="text-xs font-display text-gray-800 dark:text-white">
                    Datos curiosos
                  </span>
                </div>
                <div className="space-y-2">
                  {matchup.facts.map((fact, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-gray-50 dark:bg-white/[0.03] px-3 py-2"
                    >
                      <p className="text-[10px] font-body font-semibold text-[#2A398D] dark:text-blue-400 mb-0.5">
                        {fact.title}
                      </p>
                      <p className="text-[11px] font-body text-gray-600 dark:text-gray-400 leading-relaxed">
                        {fact.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
