'use client'

import { useMemo, useRef, useState, useCallback } from 'react'
import { Trophy, Share2, Download, Loader2 } from 'lucide-react'
import { toPng } from 'html-to-image'
import { cn } from '@/lib/utils/cn'
import { TEAMS } from '@/lib/constants/teams'
import {
  R16_BRACKET,
  QF_BRACKET,
  SF_BRACKET,
  FINAL_BRACKET,
  type BracketMatchDef,
} from '@/lib/constants/bracket'
import type { TeamData } from '@/lib/constants/teams'

const TEAMS_BY_ID: Record<string, TeamData> = Object.fromEntries(TEAMS.map((t) => [t.id, t]))

interface BracketPopupProps {
  knockoutPredictions: Record<number, string>
  userName?: string
}

function resolveTeam(
  match: BracketMatchDef,
  side: 'home' | 'away',
  predictions: Record<number, string>
): TeamData | null {
  const { source } = match[side]
  if (source.kind === 'winner') {
    const winnerId = predictions[source.matchNumber]
    return winnerId ? TEAMS_BY_ID[winnerId] ?? null : null
  }
  return null
}

// ─── Match Cell ─────────────────────────────────────────────────────

function MatchCell({
  match,
  predictions,
  size = 'sm',
}: {
  match: BracketMatchDef
  predictions: Record<number, string>
  size?: 'sm' | 'md' | 'lg'
}) {
  const winner = predictions[match.matchNumber]
  const winnerTeam = winner ? TEAMS_BY_ID[winner] : null
  const homeTeam = resolveTeam(match, 'home', predictions)
  const awayTeam = resolveTeam(match, 'away', predictions)

  const h = size === 'lg' ? 'h-8' : size === 'md' ? 'h-7' : 'h-6'
  const text = size === 'lg' ? 'text-xs' : 'text-[11px]'
  const emoji = size === 'lg' ? 'text-base' : size === 'md' ? 'text-sm' : 'text-xs'

  if (!winnerTeam && !homeTeam && !awayTeam) {
    return (
      <div className="rounded-md border border-dashed border-gray-200 dark:border-white/10 overflow-hidden">
        <div className={cn(h, 'flex items-center justify-center bg-gray-50/50 dark:bg-white/[0.02]')}>
          <span className="text-[9px] font-mono text-gray-300 dark:text-gray-600">P{match.matchNumber}</span>
        </div>
        <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />
        <div className={cn(h, 'flex items-center justify-center bg-gray-50/50 dark:bg-white/[0.02]')}>
          <span className="text-[9px] font-mono text-gray-300 dark:text-gray-600">—</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-gray-200 dark:border-white/10 overflow-hidden">
      <TeamRow2 team={homeTeam} isWinner={!!winnerTeam && winnerTeam.id === homeTeam?.id} h={h} text={text} emoji={emoji} />
      <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />
      <TeamRow2 team={awayTeam} isWinner={!!winnerTeam && winnerTeam.id === awayTeam?.id} h={h} text={text} emoji={emoji} />
    </div>
  )
}

function TeamRow2({ team, isWinner, h, text, emoji }: {
  team: TeamData | null
  isWinner: boolean
  h: string
  text: string
  emoji: string
}) {
  if (!team) {
    return (
      <div className={cn(h, 'flex items-center px-2 bg-white dark:bg-white/[0.02]')}>
        <span className="text-[9px] font-mono text-gray-300 dark:text-gray-600">TBD</span>
      </div>
    )
  }
  return (
    <div className={cn(
      h, 'flex items-center gap-1.5 px-2 transition-colors',
      isWinner ? 'bg-[#3CAC3B]/10' : 'bg-white dark:bg-white/[0.02]'
    )}>
      <span className={emoji}>{team.flag_emoji}</span>
      <span className={cn(
        'font-body truncate flex-1',
        text,
        isWinner ? 'font-bold text-[#3CAC3B]' : 'text-gray-600 dark:text-gray-400'
      )}>
        {team.code}
      </span>
      {isWinner && <span className="text-[7px] font-mono text-[#3CAC3B]">▶</span>}
    </div>
  )
}

// ─── Side bracket column (R16 → QF → SF) ───────────────────────────

function SideBracket({
  label,
  r16,
  qf,
  sf,
  predictions,
  reverse = false,
}: {
  label: string
  r16: BracketMatchDef[]
  qf: BracketMatchDef[]
  sf: BracketMatchDef[]
  predictions: Record<number, string>
  reverse?: boolean
}) {
  const rounds = [
    { name: 'Octavos', matches: r16, size: 'sm' as const },
    { name: 'Cuartos', matches: qf, size: 'md' as const },
    { name: 'Semi', matches: sf, size: 'md' as const },
  ]
  const ordered = reverse ? [...rounds].reverse() : rounds

  return (
    <div className="flex-1 min-w-0">
      <div className={cn(
        'text-[10px] font-display uppercase tracking-wider mb-2',
        reverse ? 'text-right text-[#E61D25]' : 'text-[#2A398D]'
      )}>
        {label}
      </div>
      <div className={cn('flex gap-1.5 sm:gap-2.5', reverse && 'flex-row-reverse')}>
        {ordered.map((round) => (
          <div key={round.name} className="flex-1 min-w-0 flex flex-col justify-around gap-1.5 sm:gap-2">
            <div className={cn(
              'text-[7px] sm:text-[8px] font-mono uppercase tracking-wider text-gray-400 mb-0.5',
              reverse ? 'text-right' : ''
            )}>
              {round.name}
            </div>
            {round.matches.map((m) => (
              <MatchCell key={m.matchNumber} match={m} predictions={predictions} size={round.size} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Bracket ──────────────────────────────────────────────────

export function BracketPopup({ knockoutPredictions, userName }: BracketPopupProps) {
  const bracketRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const champion = knockoutPredictions[103] ? TEAMS_BY_ID[knockoutPredictions[103]] : null
  const finalMatch = FINAL_BRACKET[0]
  const hasAnyPicks = Object.keys(knockoutPredictions).length > 0

  // Side A: R16(89-92) → QF(97,98) → SF(101)
  const sideA = useMemo(() => ({
    r16: R16_BRACKET.slice(0, 4),
    qf: QF_BRACKET.slice(0, 2),
    sf: SF_BRACKET.slice(0, 1),
  }), [])

  // Side B: R16(93-96) → QF(99,100) → SF(102)
  const sideB = useMemo(() => ({
    r16: R16_BRACKET.slice(4, 8),
    qf: QF_BRACKET.slice(2, 4),
    sf: SF_BRACKET.slice(1, 2),
  }), [])

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!bracketRef.current) return null
    try {
      const dataUrl = await toPng(bracketRef.current, {
        backgroundColor: '#0a0a0f',
        pixelRatio: 2,
        style: { padding: '24px' },
      })
      const res = await fetch(dataUrl)
      return await res.blob()
    } catch {
      return null
    }
  }, [])

  const fileName = `bracket-golazo26${userName ? `-${userName.replace(/\s+/g, '_')}` : ''}.png`

  const handleShare = useCallback(async () => {
    setExporting(true)
    const blob = await generateImage()
    if (!blob) { setExporting(false); return }

    const file = new File([blob], fileName, { type: 'image/png' })

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Mi Bracket - Golazo 2026',
          text: champion ? `Mi campeón: ${champion.name} ${champion.flag_emoji}` : 'Mi bracket del Mundial 2026',
        })
      } catch {
        // User cancelled share — ignore
      }
    } else {
      // Fallback: download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = fileName
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    }
    setExporting(false)
  }, [generateImage, fileName, champion])

  const handleDownload = useCallback(async () => {
    setExporting(true)
    const blob = await generateImage()
    if (!blob) { setExporting(false); return }
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = fileName
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }, [generateImage, fileName])

  return (
    <div className="space-y-3">
      {/* Share / Download buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleDownload}
          disabled={exporting || !hasAnyPicks}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={12} />
          Descargar
        </button>
        <button
          onClick={handleShare}
          disabled={exporting || !hasAnyPicks}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium bg-[#2A398D]/10 text-[#2A398D] hover:bg-[#2A398D]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {exporting ? <Loader2 size={12} className="animate-spin" /> : <Share2 size={12} />}
          {exporting ? 'Generando...' : 'Compartir'}
        </button>
      </div>

      {/* Bracket container — captured for export */}
      <div ref={bracketRef} className="rounded-xl overflow-hidden bg-white dark:bg-[#0f0f1a] p-2.5 sm:p-4">
        {/* Champion */}
        <div className="flex flex-col items-center gap-1 mb-3">
          {champion ? (
            <>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#C9A84C]/20">
                <Trophy size={16} className="text-white" />
              </div>
              <span className="text-xl sm:text-2xl">{champion.flag_emoji}</span>
              <span className="text-xs sm:text-sm font-display text-[#C9A84C] tracking-wide">{champion.name}</span>
              <span className="text-[7px] sm:text-[8px] font-mono text-gray-400 uppercase tracking-widest">Campeón</span>
            </>
          ) : (
            <>
              <div className="w-11 h-11 rounded-full border-2 border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center">
                <Trophy size={16} className="text-gray-300 dark:text-gray-600" />
              </div>
              <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">Campeón</span>
            </>
          )}
        </div>

        {/* Final match */}
        <div className="max-w-[160px] sm:max-w-[180px] mx-auto mb-3">
          <div className="text-[7px] sm:text-[8px] font-mono text-center text-[#E61D25] uppercase tracking-wider mb-1">Final</div>
          <MatchCell match={finalMatch} predictions={knockoutPredictions} size="lg" />
        </div>

        {/* Connecting gradient line */}
        <div className="flex justify-center mb-2.5">
          <div className="w-[70%] h-px bg-gradient-to-r from-[#2A398D]/40 via-gray-200 dark:via-white/10 to-[#E61D25]/40" />
        </div>

        {/* Two sides: A | B */}
        <div className="flex gap-2 sm:gap-3">
          <SideBracket
            label="Lado A"
            r16={sideA.r16}
            qf={sideA.qf}
            sf={sideA.sf}
            predictions={knockoutPredictions}
          />
          <div className="w-px bg-gradient-to-b from-transparent via-gray-200 dark:via-white/10 to-transparent flex-shrink-0" />
          <SideBracket
            label="Lado B"
            r16={sideB.r16}
            qf={sideB.qf}
            sf={sideB.sf}
            predictions={knockoutPredictions}
            reverse
          />
        </div>

        {/* Footer branding for export */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-[#2A398D] flex items-center justify-center">
              <span className="font-display text-white text-[8px]">26</span>
            </div>
            <span className="text-[10px] font-display text-gray-400">Golazo 2026</span>
          </div>
          {userName && (
            <span className="text-[10px] font-mono text-gray-400">@{userName.split(' ')[0]}</span>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!hasAnyPicks && (
        <div className="text-center py-4">
          <p className="text-sm font-body text-gray-400">
            Aún no has elegido ningún equipo en la fase de eliminación
          </p>
        </div>
      )}
    </div>
  )
}
