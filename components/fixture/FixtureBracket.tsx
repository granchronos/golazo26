'use client'

import { cn } from '@/lib/utils/cn'
import { Trophy } from 'lucide-react'
import {
  R32_BRACKET,
  R16_BRACKET,
  QF_BRACKET,
  SF_BRACKET,
  FINAL_BRACKET,
  BRACKET_ROUNDS,
  type BracketMatchDef,
} from '@/lib/constants/bracket'

// ─── Date formatter ────────────────────────────────────────────────
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
function fmtDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

// ─── Match slot card ───────────────────────────────────────────────

function SlotCard({ match }: { match: BracketMatchDef }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden w-[150px]">
      <SlotRow label={match.home.label} />
      <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />
      <SlotRow label={match.away.label} />
      <div className="text-center py-0.5 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/[0.06]">
        <span className="text-[8px] font-mono text-gray-400">{fmtDate(match.matchDate)}</span>
      </div>
    </div>
  )
}

function SlotRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 h-[20px]">
      <span className="text-[9px] font-mono text-gray-500 dark:text-gray-400 truncate">
        {label}
      </span>
    </div>
  )
}

// ─── Round section (vertical list of matches per round) ────────────

function RoundSection({
  label,
  points,
  matches,
  dateRange,
}: {
  label: string
  points: number
  matches: BracketMatchDef[]
  dateRange: string
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm dark:text-white">{label}</span>
          <span className="text-[9px] font-mono text-[#C9A84C] bg-[#C9A84C]/10 px-1.5 py-0.5 rounded-full">
            +{points} pts
          </span>
        </div>
        <span className="text-[10px] font-mono text-gray-400">{dateRange}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-3">
        {matches.map((m) => (
          <SlotCard key={m.matchNumber} match={m} />
        ))}
      </div>
    </div>
  )
}

// ─── Main export ───────────────────────────────────────────────────

export function FixtureBracket() {
  const rounds = [
    { label: 'Ronda de 32', points: 10, matches: R32_BRACKET, dateRange: '28 Jun – 6 Jul' },
    { label: 'Octavos de Final', points: 15, matches: R16_BRACKET, dateRange: '8 – 11 Jul' },
    { label: 'Cuartos de Final', points: 20, matches: QF_BRACKET, dateRange: '14 – 15 Jul' },
    { label: 'Semifinales', points: 50, matches: SF_BRACKET, dateRange: '14 – 15 Jul' },
    { label: 'Final', points: 100, matches: FINAL_BRACKET, dateRange: '19 Jul' },
  ]

  return (
    <div className="space-y-4">
      {/* Trophy header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#D4AF37] flex items-center justify-center shadow-md shadow-[#C9A84C]/20">
          <Trophy size={14} className="text-white" />
        </div>
        <div>
          <h3 className="font-display text-lg dark:text-white">Fase Eliminatoria</h3>
          <p className="text-[10px] font-mono text-gray-400">
            32 equipos · 31 partidos · 28 Jun – 19 Jul 2026
          </p>
        </div>
      </div>

      {/* Bracket path summary */}
      <div className="flex flex-wrap items-center gap-1.5">
        {rounds.map((r, i) => (
          <div key={r.label} className="flex items-center gap-1.5">
            <span className={cn(
              'text-[10px] font-body px-2 py-1 rounded-lg',
              i === rounds.length - 1
                ? 'bg-[#C9A84C]/10 text-[#C9A84C] font-semibold'
                : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500'
            )}>
              {r.label} ({r.matches.length})
            </span>
            {i < rounds.length - 1 && (
              <span className="text-[10px] text-gray-300 dark:text-gray-600">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Round sections */}
      {rounds.map((r) => (
        <RoundSection key={r.label} {...r} />
      ))}
    </div>
  )
}
