'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { TeamData } from '@/lib/constants/teams'
import { TEAMS, TEAMS_BY_ID } from '@/lib/constants/teams'
import { ROUND_LABELS, ROUND_POINTS, SIGN_POINTS, TEAM_BET_POINTS } from '@/lib/constants/points'
import type { Match } from '@/types/database'

interface PointsBreakdownProps {
  match: Match
  matchPoints: { signPoints: number; extraPoints: number; total: number } | null
  savedScore: { home: number; away: number } | null
  knockoutPrediction: string | null
}

export function PointsBreakdown({ match, matchPoints, savedScore, knockoutPrediction }: PointsBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({})
  const badgeRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
          badgeRef.current && !badgeRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const scorePoints = matchPoints?.total || 0
  const signPts = matchPoints?.signPoints || 0
  const extraPts = matchPoints?.extraPoints || 0

  const roundLabel = ROUND_LABELS[match.round] || match.round
  const roundPoints = match.round !== 'group' ? (ROUND_POINTS[match.round] || 0) : 0
  const hasCorrectWinner = knockoutPrediction && match.winner_id && knockoutPrediction === match.winner_id
  const roundWinnerPoints = hasCorrectWinner ? roundPoints : 0

  const homeTeam = match.home_team_id ? TEAMS_BY_ID[match.home_team_id] : null
  const awayTeam = match.away_team_id ? TEAMS_BY_ID[match.away_team_id] : null

  const totalPoints = scorePoints + roundWinnerPoints

  const items: Array<{ label: string; pts: number; positive: boolean }> = []

  if (scorePoints > 0) {
    if (signPts > 0) items.push({ label: 'Signo correcto', pts: signPts, positive: true })
    if (extraPts > 0) items.push({ label: 'Aproximación', pts: extraPts, positive: true })
  }
  if (roundWinnerPoints > 0) {
    items.push({ label: `Ganador de ${roundLabel}`, pts: roundWinnerPoints, positive: true })
  }
  if (totalPoints === 0 && savedScore) {
    items.push({ label: 'Sin acierto', pts: 0, positive: false })
  }

  if (totalPoints === 0 && !savedScore) return null

  const handleToggle = () => {
    if (!isOpen && badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect()
      const popoverW = 288
      const popoverH = 240
      const gap = 4
      const viewW = window.innerWidth
      const viewH = window.innerHeight

      // Horizontal: prefer right-aligned, but clamp to viewport
      let left = rect.right - popoverW
      if (left < 8) left = 8
      if (left + popoverW > viewW - 8) left = viewW - popoverW - 8

      // Vertical: prefer below, else above, else center
      const spaceBelow = viewH - rect.bottom
      const spaceAbove = rect.top
      let top: number
      let origin: string

      if (spaceBelow >= popoverH + gap) {
        top = rect.bottom + gap
        origin = 'top right'
      } else if (spaceAbove >= popoverH + gap) {
        top = rect.top - popoverH - gap
        origin = 'bottom right'
      } else {
        top = (viewH - popoverH) / 2
        origin = 'center right'
      }

      setPopoverStyle({
        position: 'fixed',
        top: Math.max(8, Math.min(top, viewH - popoverH - 8)),
        left,
        zIndex: 9999,
      })
    }
    setIsOpen(!isOpen)
  }

  const popoverContent = (
    <div className="w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 dark:border-zinc-800">
        <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          Detalle de Puntos
        </span>
        <button
          onClick={() => setIsOpen(false)}
          className="p-0.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors"
        >
          <X size={12} className="text-gray-400" />
        </button>
      </div>

      <div className="px-3 py-2.5 space-y-2.5">
        {/* Match info */}
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {homeTeam?.name ?? '?'} {match.home_score ?? '-'}-{match.away_score ?? '-'} {awayTeam?.name ?? '?'}
          </span>
        </div>
        <div className="text-[10px] text-gray-400 font-mono -mt-2">
          {roundLabel} · Partido #{match.match_number}
        </div>

        {/* User's score prediction */}
        {savedScore && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-gray-500">Tu pronóstico:</span>
            <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
              {savedScore.home}-{savedScore.away}
            </span>
          </div>
        )}

        {/* Breakdown */}
        <div className="space-y-1.5 pt-1.5 border-t border-gray-100 dark:border-zinc-800">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
              <span className={cn(
                'font-mono font-bold',
                item.positive ? 'text-[#3CAC3B]' : 'text-[#E61D25]'
              )}>
                {item.positive ? `+${item.pts}` : `${item.pts}`} pts
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100 dark:border-zinc-800">
          <span className="font-bold text-gray-900 dark:text-white">TOTAL</span>
          <span className={cn(
            'font-mono font-bold',
            totalPoints > 0 ? 'text-[#3CAC3B]' : 'text-[#E61D25]'
          )}>
            {totalPoints > 0 ? `+${totalPoints}` : '0'} pts
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="inline-flex">
      <div
        ref={badgeRef}
        onClick={handleToggle}
        className={cn(
          'cursor-pointer select-none',
          totalPoints > 0 ? 'hover:opacity-80' : ''
        )}
      >
        <div className={cn(
          'flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-colors',
          totalPoints > 0
            ? totalPoints >= 5
              ? 'text-[#3CAC3B] bg-[#3CAC3B]/10'
              : totalPoints >= 3
                ? 'text-[#C9A84C] bg-[#C9A84C]/10'
                : 'text-[#2A398D] bg-[#2A398D]/10'
            : 'text-[#E61D25] bg-[#E61D25]/10'
        )}>
          {totalPoints > 0 ? <Check size={9} /> : <X size={9} />}
          <span>{totalPoints > 0 ? `+${totalPoints}` : '0'} pts</span>
        </div>
      </div>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
          <div ref={popoverRef} style={popoverStyle}>
            {popoverContent}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
