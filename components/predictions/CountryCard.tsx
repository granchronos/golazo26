'use client'

import { motion } from 'framer-motion'
import { Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { TeamData } from '@/lib/constants/teams'

interface CountryCardProps {
  team: TeamData
  state: 'available' | 'selected' | 'locked'
  points?: number
  rank?: '1st' | '2nd'
  onClick?: () => void
}

export function CountryCard({ team, state, points, rank, onClick }: CountryCardProps) {
  const isSelected = state === 'selected'
  const isLocked = state === 'locked'

  return (
    <motion.button
      onClick={isLocked ? undefined : onClick}
      whileHover={!isLocked ? { scale: 1.04, y: -2 } : {}}
      whileTap={!isLocked ? { scale: 0.97 } : {}}
      disabled={isLocked}
      className={cn(
        'relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 w-full text-left',
        state === 'available' && 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-[#2A398D]/50 hover:shadow-md',
        state === 'selected' && 'border-[#2A398D] bg-[#2A398D]/8 dark:bg-[#2A398D]/20 shadow-md shadow-[#2A398D]/20',
        state === 'locked' && 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/2 opacity-50 cursor-not-allowed',
      )}
    >
      {/* Rank badge */}
      {rank && isSelected && (
        <div className={cn(
          'absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold',
          rank === '1st' ? 'bg-[#C9A84C]' : 'bg-[#2A398D]'
        )}>
          {rank === '1st' ? '1' : '2'}
        </div>
      )}

      {/* Selected check */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <Check size={14} className="text-[#2A398D]" />
        </div>
      )}

      {/* Locked */}
      {isLocked && (
        <div className="absolute top-2 right-2">
          <Lock size={12} className="text-gray-400" />
        </div>
      )}

      {/* Flag */}
      <span className={cn('text-3xl transition-all', isSelected && 'drop-shadow-lg')}>
        {team.flag_emoji}
      </span>

      {/* Name */}
      <span className={cn(
        'text-xs font-body font-medium text-center leading-tight',
        isSelected ? 'text-[#2A398D] dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
      )}>
        {team.code}
      </span>

      {/* Points */}
      {points !== undefined && isSelected && (
        <span className="font-mono text-xs font-bold text-[#C9A84C]">
          +{points}pts
        </span>
      )}
    </motion.button>
  )
}
