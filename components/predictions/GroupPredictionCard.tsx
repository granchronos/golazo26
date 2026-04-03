'use client'

import { Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { WCBadge } from '@/components/ui/WCBadge'
import type { GroupLetter } from '@/types/database'
import type { TeamData } from '@/lib/constants/teams'

interface GroupPredictionCardProps {
  groupLetter: GroupLetter
  teams: TeamData[]
  first: string | null
  second: string | null
  savedFirst: string | null
  savedSecond: string | null
  onChange: (first: string | null, second: string | null) => void
  onSave: () => void
  isSaving: boolean
  isOpen: boolean
}

export function GroupPredictionCard({
  groupLetter,
  teams,
  first,
  second,
  savedFirst,
  savedSecond,
  onChange,
  onSave,
  isSaving,
  isOpen,
}: GroupPredictionCardProps) {
  const hasChanged = first !== savedFirst || second !== savedSecond
  const isSaved = savedFirst && savedSecond && !hasChanged

  const handleSelect = (teamId: string) => {
    if (!isOpen) return

    if (first === teamId) {
      onChange(null, second)
    } else if (second === teamId) {
      onChange(first, null)
    } else if (!first) {
      onChange(teamId, second)
    } else if (!second) {
      onChange(first, teamId)
    } else {
      onChange(second, teamId)
    }
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
        <span className="font-display text-sm text-gray-900 dark:text-white">Grupo {groupLetter}</span>
        {!isOpen && (
          <span className="flex items-center gap-1 text-[10px] font-body text-gray-400">
            <Lock size={10} /> Cerrado
          </span>
        )}
        {isSaved && (
          <span className="flex items-center gap-1 text-[10px] font-body text-[#3CAC3B]">
            <Check size={10} /> Guardado
          </span>
        )}
        {isOpen && hasChanged && first && second && (
          <span className="text-[10px] font-body text-[#C9A84C] font-semibold">Sin guardar</span>
        )}
      </div>

      {/* Team list */}
      <div id={groupLetter === 'A' ? 'tour-team-list' : undefined} className="divide-y divide-gray-50 dark:divide-white/[0.04]">
        {teams.map((team) => {
          const isFirst = first === team.id
          const isSecond = second === team.id
          const isSelected = isFirst || isSecond

          return (
            <button
              key={team.id}
              onClick={() => handleSelect(team.id)}
              disabled={!isOpen}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors min-h-[48px]',
                isSelected && 'bg-[#2A398D]/[0.04] dark:bg-[#2A398D]/10',
                isFirst && 'border-l-[3px] border-l-[#C9A84C]',
                isSecond && 'border-l-[3px] border-l-[#2A398D]',
                !isSelected && 'border-l-[3px] border-l-transparent',
                isOpen && !isSelected && 'hover:bg-gray-50 dark:hover:bg-white/[0.03]',
                !isOpen && 'cursor-default'
              )}
            >
              <span className="text-lg leading-none">{team.flag_emoji}</span>
              <span className="flex-1 text-sm font-body text-gray-800 dark:text-gray-200">
                {team.name}
              </span>
              <WCBadge teamId={team.id} size="xs" />
              {isFirst && (
                <span className="text-[10px] font-body font-semibold text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded-full">
                  1°
                </span>
              )}
              {isSecond && (
                <span className="text-[10px] font-body font-semibold text-[#2A398D] dark:text-blue-400 bg-[#2A398D]/10 px-2 py-0.5 rounded-full">
                  2°
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Per-group save button */}
      {isOpen && first && second && hasChanged && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.06]">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="w-full btn-fwc text-xs py-2"
          >
            {isSaving ? 'Guardando...' : 'Guardar grupo'}
          </button>
        </div>
      )}
    </div>
  )
}
