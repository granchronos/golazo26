'use client'

import { useMemo, useRef, useState, useCallback } from 'react'
import { Trophy, Share2, Download, Loader2 } from 'lucide-react'
import { toPng } from 'html-to-image'
import { cn } from '@/lib/utils/cn'
import { TEAMS, WC_HISTORY } from '@/lib/constants/teams'
import {
  R16_BRACKET,
  QF_BRACKET,
  SF_BRACKET,
  FINAL_BRACKET,
  type BracketMatchDef,
} from '@/lib/constants/bracket'
import type { TeamData } from '@/lib/constants/teams'

const TEAMS_BY_ID: Record<string, TeamData> = Object.fromEntries(
  TEAMS.map((t) => [t.id, t])
)

// ─── Layout constants ──────────────────────────────────────────────
const MATCH_W = 132
const MATCH_H = 44
const COL_GAP = 20 // extra space for date labels
const CONN_W = 28
const LABEL_H = 22

// Vertical positions computed from R16 (4 cards)
const MATCH_AREA_H = 4 * MATCH_H + 3 * COL_GAP // 236
const R16_TOPS = [0, MATCH_H + COL_GAP, 2 * (MATCH_H + COL_GAP), 3 * (MATCH_H + COL_GAP)]
const R16_CENTERS = R16_TOPS.map((t) => t + MATCH_H / 2)

const QF_TOPS = [
  (R16_CENTERS[0] + R16_CENTERS[1]) / 2 - MATCH_H / 2,
  (R16_CENTERS[2] + R16_CENTERS[3]) / 2 - MATCH_H / 2,
]
const QF_CENTERS = QF_TOPS.map((t) => t + MATCH_H / 2)

const SF_TOPS = [(QF_CENTERS[0] + QF_CENTERS[1]) / 2 - MATCH_H / 2]
const SF_CENTER = SF_TOPS[0] + MATCH_H / 2

const FINAL_TOP = SF_TOPS[0]

// ─── Date formatter ────────────────────────────────────────────────
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
function fmtDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

// ─── WC badge label ────────────────────────────────────────────────
const BEST_LABELS: Record<string, string> = {
  Final: 'Final',
  Semi: 'Semi',
  Cuartos: '4tos',
  Octavos: '8vos',
  Grupos: 'Grupos',
  Debut: 'Debut',
}

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

// ─── Match Card ────────────────────────────────────────────────────

function MatchCard({
  match,
  predictions,
  highlight = false,
  showDate = true,
}: {
  match: BracketMatchDef
  predictions: Record<number, string>
  highlight?: boolean
  showDate?: boolean
}) {
  const winner = predictions[match.matchNumber]
  const winnerTeam = winner ? TEAMS_BY_ID[winner] : null
  const homeTeam = resolveTeam(match, 'home', predictions)
  const awayTeam = resolveTeam(match, 'away', predictions)

  return (
    <div>
      <div
        className={cn(
          'rounded-lg overflow-hidden shadow-sm',
          highlight
            ? 'border-2 border-[#C9A84C]/50 shadow-[#C9A84C]/10'
            : 'border border-gray-200 dark:border-white/10',
          'bg-white dark:bg-white/[0.03]'
        )}
        style={{ width: MATCH_W, height: MATCH_H }}
      >
        <TeamSlot
          team={homeTeam}
          isWinner={!!winnerTeam && winnerTeam.id === homeTeam?.id}
          matchNum={match.matchNumber}
          pos="top"
        />
        <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />
        <TeamSlot
          team={awayTeam}
          isWinner={!!winnerTeam && winnerTeam.id === awayTeam?.id}
          matchNum={match.matchNumber}
          pos="bot"
        />
      </div>
      {showDate && (
        <div className="text-center mt-0.5">
          <span className="text-[7px] font-mono text-gray-400 dark:text-gray-500">
            {fmtDate(match.matchDate)}
          </span>
        </div>
      )}
    </div>
  )
}

function TeamSlot({
  team,
  isWinner,
  matchNum,
  pos,
}: {
  team: TeamData | null
  isWinner: boolean
  matchNum: number
  pos: 'top' | 'bot'
}) {
  const slotH = (MATCH_H - 1) / 2
  const history = team ? WC_HISTORY[team.id] : null

  return (
    <div
      className={cn('flex items-center gap-1 px-1.5', isWinner ? 'bg-[#3CAC3B]/10' : '')}
      style={{ height: slotH }}
    >
      {team ? (
        <>
          <span className="text-[11px] leading-none flex-shrink-0">{team.flag_emoji}</span>
          <span
            className={cn(
              'text-[10px] font-body leading-none flex-shrink-0',
              isWinner
                ? 'font-bold text-[#3CAC3B]'
                : 'text-gray-700 dark:text-gray-300'
            )}
          >
            {team.code}
          </span>
          <span className="flex-1" />
          {/* WC history badge */}
          {history && history.titles > 0 ? (
            <span className="text-[7px] font-bold text-[#C9A84C] leading-none flex-shrink-0">
              ★{history.titles}
            </span>
          ) : history?.best ? (
            <span
              className={cn(
                'text-[7px] font-mono leading-none flex-shrink-0',
                history.best === 'Final'
                  ? 'text-blue-400'
                  : history.best === 'Semi'
                    ? 'text-emerald-400'
                    : history.best === 'Debut'
                      ? 'text-purple-300 dark:text-purple-400'
                      : 'text-gray-400 dark:text-gray-500'
              )}
            >
              {BEST_LABELS[history.best]}
            </span>
          ) : null}
        </>
      ) : (
        <span className="text-[8px] font-mono text-gray-300 dark:text-gray-600 leading-none">
          {pos === 'top' ? `P${matchNum}` : '—'}
        </span>
      )}
    </div>
  )
}

// ─── SVG Connector Lines ───────────────────────────────────────────

function Connector({
  fromCenters,
  toCenters,
  side,
}: {
  fromCenters: number[]
  toCenters: number[]
  side: 'left' | 'right'
}) {
  const w = CONN_W
  const mid = w / 2
  const paths: string[] = []

  for (let i = 0; i < toCenters.length; i++) {
    const top = fromCenters[i * 2]
    const bot = fromCenters[i * 2 + 1]
    const target = toCenters[i]

    if (top !== undefined && bot !== undefined) {
      if (side === 'left') {
        paths.push(`M0,${top} H${mid} V${target} H${w}`)
        paths.push(`M0,${bot} H${mid} V${target}`)
      } else {
        paths.push(`M${w},${top} H${mid} V${target} H0`)
        paths.push(`M${w},${bot} H${mid} V${target}`)
      }
    } else if (top !== undefined) {
      if (side === 'left') {
        paths.push(`M0,${top} H${w}`)
      } else {
        paths.push(`M${w},${top} H0`)
      }
    }
  }

  return (
    <svg
      width={w}
      height={MATCH_AREA_H}
      className="flex-shrink-0"
      style={{ minWidth: w }}
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-gray-200 dark:text-white/10"
        />
      ))}
    </svg>
  )
}

// ─── Positioned Round Column ───────────────────────────────────────

function RoundColumn({
  label,
  matches,
  tops,
  predictions,
  labelColor,
  highlight = false,
  showDates = true,
}: {
  label: string
  matches: BracketMatchDef[]
  tops: number[]
  predictions: Record<number, string>
  labelColor?: string
  highlight?: boolean
  showDates?: boolean
}) {
  return (
    <div className="flex-shrink-0" style={{ width: MATCH_W }}>
      <div
        className={cn(
          'text-[8px] font-mono uppercase tracking-wider text-center mb-0.5',
          labelColor ?? 'text-gray-400'
        )}
        style={{ height: LABEL_H, lineHeight: `${LABEL_H}px` }}
      >
        {label}
      </div>
      <div className="relative" style={{ height: MATCH_AREA_H }}>
        {matches.map((m, i) => (
          <div key={m.matchNumber} className="absolute left-0" style={{ top: tops[i] }}>
            <MatchCard
              match={m}
              predictions={predictions}
              highlight={highlight}
              showDate={showDates}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Export ────────────────────────────────────────────────────

export function BracketPopup({ knockoutPredictions, userName }: BracketPopupProps) {
  const bracketRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const champion = knockoutPredictions[103]
    ? TEAMS_BY_ID[knockoutPredictions[103]]
    : null
  const championHistory = champion ? WC_HISTORY[champion.id] : null
  const finalMatch = FINAL_BRACKET[0]
  const hasAnyPicks = Object.keys(knockoutPredictions).length > 0

  // Side A (left): R16(89-92) → QF(97,98) → SF(101)
  const leftR16 = useMemo(() => R16_BRACKET.slice(0, 4), [])
  const leftQF = useMemo(() => QF_BRACKET.slice(0, 2), [])
  const leftSF = useMemo(() => SF_BRACKET.slice(0, 1), [])

  // Side B (right): R16(93-96) → QF(99,100) → SF(102)
  const rightR16 = useMemo(() => R16_BRACKET.slice(4, 8), [])
  const rightQF = useMemo(() => QF_BRACKET.slice(2, 4), [])
  const rightSF = useMemo(() => SF_BRACKET.slice(1, 2), [])

  // ── Share / Download ──────────────────────────────────────────────

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
    if (!blob) {
      setExporting(false)
      return
    }
    const file = new File([blob], fileName, { type: 'image/png' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Mi Bracket - Golazo 2026',
          text: champion
            ? `Mi campeón: ${champion.name} ${champion.flag_emoji}`
            : 'Mi bracket del Mundial 2026',
        })
      } catch {
        /* cancelled */
      }
    } else {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.download = fileName
      a.href = url
      a.click()
      URL.revokeObjectURL(url)
    }
    setExporting(false)
  }, [generateImage, fileName, champion])

  const handleDownload = useCallback(async () => {
    setExporting(true)
    const blob = await generateImage()
    if (!blob) {
      setExporting(false)
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.download = fileName
    a.href = url
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }, [generateImage, fileName])

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Action buttons */}
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
          {exporting ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Share2 size={12} />
          )}
          {exporting ? 'Generando...' : 'Compartir'}
        </button>
      </div>

      {/* Bracket — horizontal scroll on mobile */}
      <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
        <div
          ref={bracketRef}
          className="bg-white dark:bg-[#0f0f1a] rounded-xl p-4 inline-block min-w-max"
        >
          {/* Champion badge */}
          <div className="flex flex-col items-center gap-1 mb-4">
            {champion ? (
              <>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#D4AF37] flex items-center justify-center shadow-md shadow-[#C9A84C]/20">
                  <Trophy size={14} className="text-white" />
                </div>
                <span className="text-lg">{champion.flag_emoji}</span>
                <span className="text-xs font-display text-[#C9A84C] tracking-wide">
                  {champion.name}
                </span>
                {championHistory && championHistory.titles > 0 ? (
                  <span className="text-[9px] font-bold text-[#C9A84C]">
                    {'★'.repeat(Math.min(championHistory.titles, 5))}{championHistory.titles > 5 ? `+${championHistory.titles - 5}` : ''}
                  </span>
                ) : championHistory?.best ? (
                  <span className="text-[8px] font-mono text-gray-400">
                    Máx: {BEST_LABELS[championHistory.best]}
                    {championHistory.bestYear ? ` '${String(championHistory.bestYear).slice(2)}` : ''}
                  </span>
                ) : null}
                <span className="text-[7px] font-mono text-gray-400 uppercase tracking-widest">
                  Campeón
                </span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center">
                  <Trophy size={14} className="text-gray-300 dark:text-gray-600" />
                </div>
                <span className="text-[8px] font-mono text-gray-400 uppercase">
                  Campeón
                </span>
              </>
            )}
          </div>

          {/* Horizontal bracket */}
          <div className="flex items-start">
            {/* ─── LEFT SIDE (Side A) ─── */}
            <RoundColumn
              label="Octavos"
              matches={leftR16}
              tops={R16_TOPS}
              predictions={knockoutPredictions}
              labelColor="text-[#2A398D]"
            />
            <div style={{ paddingTop: LABEL_H }}>
              <Connector fromCenters={R16_CENTERS} toCenters={QF_CENTERS} side="left" />
            </div>

            <RoundColumn
              label="Cuartos"
              matches={leftQF}
              tops={QF_TOPS}
              predictions={knockoutPredictions}
            />
            <div style={{ paddingTop: LABEL_H }}>
              <Connector fromCenters={QF_CENTERS} toCenters={[SF_CENTER]} side="left" />
            </div>

            <RoundColumn
              label="Semi"
              matches={leftSF}
              tops={SF_TOPS}
              predictions={knockoutPredictions}
            />
            <div style={{ paddingTop: LABEL_H }}>
              <Connector fromCenters={[SF_CENTER]} toCenters={[SF_CENTER]} side="left" />
            </div>

            {/* ─── FINAL (center) ─── */}
            <div className="flex-shrink-0" style={{ width: MATCH_W + 10 }}>
              <div
                className="text-[8px] font-mono uppercase tracking-wider text-center text-[#E61D25] mb-0.5"
                style={{ height: LABEL_H, lineHeight: `${LABEL_H}px` }}
              >
                Final
              </div>
              <div className="relative" style={{ height: MATCH_AREA_H }}>
                <div
                  className="absolute left-0 right-0 flex justify-center"
                  style={{ top: FINAL_TOP }}
                >
                  <MatchCard
                    match={finalMatch}
                    predictions={knockoutPredictions}
                    highlight
                  />
                </div>
              </div>
            </div>

            {/* ─── RIGHT SIDE (Side B) ─── */}
            <div style={{ paddingTop: LABEL_H }}>
              <Connector fromCenters={[SF_CENTER]} toCenters={[SF_CENTER]} side="right" />
            </div>
            <RoundColumn
              label="Semi"
              matches={rightSF}
              tops={SF_TOPS}
              predictions={knockoutPredictions}
            />

            <div style={{ paddingTop: LABEL_H }}>
              <Connector fromCenters={QF_CENTERS} toCenters={[SF_CENTER]} side="right" />
            </div>
            <RoundColumn
              label="Cuartos"
              matches={rightQF}
              tops={QF_TOPS}
              predictions={knockoutPredictions}
            />

            <div style={{ paddingTop: LABEL_H }}>
              <Connector fromCenters={R16_CENTERS} toCenters={QF_CENTERS} side="right" />
            </div>
            <RoundColumn
              label="Octavos"
              matches={rightR16}
              tops={R16_TOPS}
              predictions={knockoutPredictions}
              labelColor="text-[#E61D25]"
            />
          </div>

          {/* Branding footer */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-[#2A398D] flex items-center justify-center">
                <span className="font-display text-white text-[8px]">26</span>
              </div>
              <span className="text-[10px] font-display text-gray-400">
                Golazo 2026
              </span>
            </div>
            {userName && (
              <span className="text-[10px] font-mono text-gray-400">
                @{userName.split(' ')[0]}
              </span>
            )}
          </div>
        </div>

        <p className="sm:hidden text-center text-[10px] text-gray-400 py-2">
          ← Desliza para ver más →
        </p>
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
