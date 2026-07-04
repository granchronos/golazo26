'use client'

import { useState, useMemo } from 'react'
import { CheckCircle2, AlertCircle, Trophy, User, Layers, Target, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GROUP_LETTERS } from '@/lib/constants/teams'
import type { GroupLetter, GroupPrediction } from '@/types/database'
import { cn } from '@/lib/utils/cn'

interface ProgressSidebarProps {
  groupPredictions: Record<GroupLetter, GroupPrediction | null>
  knockoutPredictions: Record<number, string>
  predictedChampionId: string | null
  predictedGoleador: string
}

export function ProgressSidebar({
  groupPredictions,
  knockoutPredictions,
  predictedChampionId,
  predictedGoleador,
}: ProgressSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Calculate completion statuses
  const groupStats = useMemo(() => {
    const letters = GROUP_LETTERS
    const completed: Record<GroupLetter, boolean> = {} as any
    let count = 0

    letters.forEach((l) => {
      const pred = groupPredictions[l]
      const isOk = !!pred && !!pred.team_1st_id && !!pred.team_2nd_id
      completed[l] = isOk
      if (isOk) count++
    })

    return { completed, count }
  }, [groupPredictions])

  // Cap knockout at 32 max (R32 + R16 + QF + SF + 3rd Place + Final)
  const knockoutRaw = Object.keys(knockoutPredictions).length
  const knockoutCount = Math.min(knockoutRaw, 32)

  const isChampionComplete = !!predictedChampionId
  const isGoleadorComplete = !!predictedGoleador && predictedGoleador.trim().length > 0

  // Total Progress: 12 groups + 32 knockout matches + 1 champion + 1 goleador = 46 total predictions
  const totalItems = 46
  const completedItems = Math.min(
    groupStats.count + knockoutCount + (isChampionComplete ? 1 : 0) + (isGoleadorComplete ? 1 : 0),
    totalItems
  )
  const percent = Math.min(Math.round((completedItems / totalItems) * 100), 100)

  const isAllDone = completedItems >= totalItems

  return (
    <div
      className={cn(
        'glass-card border-l-4 transition-colors',
        isAllDone
          ? 'border-l-emerald-500 bg-gradient-to-r from-emerald-50/30 to-white dark:from-emerald-950/10 dark:to-zinc-900/50'
          : 'border-l-[#2A398D] bg-gradient-to-r from-blue-50/30 to-white dark:from-blue-950/10 dark:to-zinc-900/50'
      )}
    >
      {/* Header — always visible, click to toggle */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 sm:p-5 cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <Target size={16} className={isAllDone ? 'text-emerald-500' : 'text-[#2A398D]'} />
          <h3 className="font-display text-sm text-gray-900 dark:text-white">Tu Progreso</h3>
          {isAllDone && (
            <span className="text-[10px] font-body font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
              ¡Completo!
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
            {completedItems}/{totalItems}
          </span>
          <ChevronDown
            size={14}
            className={cn(
              'text-gray-400 transition-transform duration-200',
              !isExpanded && '-rotate-90'
            )}
          />
        </div>
      </button>

      {/* Progress Bar — always visible */}
      <div className="px-4 sm:px-5 pb-2">
        <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              isAllDone
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                : 'bg-gradient-to-r from-[#2A398D] to-blue-500'
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Expandable details */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 sm:px-5 pb-4 sm:pb-5 pt-2">
              {/* Groups */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-body font-medium text-gray-600 dark:text-gray-300">
                    Fase de Grupos
                  </span>
                  <span
                    className={cn(
                      'font-mono',
                      groupStats.count >= 12 ? 'text-emerald-500' : 'text-gray-400'
                    )}
                  >
                    {groupStats.count}/12
                  </span>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-4 gap-1">
                  {GROUP_LETTERS.map((letter) => {
                    const isOk = groupStats.completed[letter]
                    return (
                      <div
                        key={letter}
                        className={cn(
                          'h-6 rounded flex items-center justify-center font-display text-[10px] border transition-colors',
                          isOk
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400'
                            : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500'
                        )}
                        title={`Grupo ${letter}: ${isOk ? 'Completado' : 'Pendiente'}`}
                      >
                        {letter}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Knockout */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-body font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <Layers size={12} className="text-[#2A398D]" /> Bracket
                  </span>
                  <span
                      className={cn(
                          'font-mono',
                          knockoutCount >= 32 ? 'text-emerald-500' : 'text-gray-400'
                      )}
                    >
                      {knockoutCount}/32
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                      className={cn(
                          'h-full rounded-full transition-all duration-500',
                          knockoutCount >= 32 ? 'bg-emerald-400' : 'bg-[#2A398D]'
                      )}
                      style={{ width: `${Math.min(Math.round((knockoutCount / 32) * 100), 100)}%` }}
                  />
                </div>
                  <p className="text-[10px] text-gray-400 font-body leading-tight">
                   32avos hasta el Tercer Lugar
                 </p>
              </div>

              {/* Special Picks */}
              <div className="space-y-2">
                <span className="text-xs font-body font-medium text-gray-600 dark:text-gray-300">
                  Predicciones Especiales
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs bg-gray-50 dark:bg-white/[0.03] p-2 rounded-lg border border-gray-100 dark:border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                      <Trophy
                        size={12}
                        className={isChampionComplete ? 'text-[#C9A84C]' : 'text-gray-400'}
                      />
                      <span className="font-body">Campeón</span>
                    </div>
                    {isChampionComplete ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <AlertCircle size={14} className="text-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs bg-gray-50 dark:bg-white/[0.03] p-2 rounded-lg border border-gray-100 dark:border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                      <User
                        size={12}
                        className={isGoleadorComplete ? 'text-[#C9A84C]' : 'text-gray-400'}
                      />
                      <span className="font-body">Goleador</span>
                    </div>
                    {isGoleadorComplete ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <AlertCircle size={14} className="text-amber-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
