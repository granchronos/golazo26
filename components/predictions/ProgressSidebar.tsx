'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Trophy, User, Layers } from 'lucide-react'
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
  const [isCollapsed, setIsCollapsed] = useState(false)

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

  const knockoutCount = useMemo(() => {
    return Object.keys(knockoutPredictions).length
  }, [knockoutPredictions])

  const isChampionComplete = !!predictedChampionId
  const isGoleadorComplete = !!predictedGoleador && predictedGoleador.trim().length > 0

  // Total Progress: 12 groups + 31 knockout matches + 1 champion + 1 goleador = 45 total predictions
  const totalItems = 45
  const completedItems = groupStats.count + knockoutCount + (isChampionComplete ? 1 : 0) + (isGoleadorComplete ? 1 : 0)
  const percent = Math.round((completedItems / totalItems) * 100)

  return (
    <div className="fixed right-0 top-1/4 z-50 flex items-start pointer-events-none">
      {/* Trigger button when collapsed */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.button
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            onClick={() => setIsCollapsed(false)}
            className="pointer-events-auto flex flex-col items-center gap-2 py-4 px-2 rounded-l-2xl bg-gradient-to-b from-[#E61D25] to-red-700 text-white shadow-2xl hover:from-red-700 hover:to-red-800 transition-all border-l border-y border-red-500/30"
          >
            <ChevronLeft size={18} className="animate-pulse" />
            <span className="font-display text-xs uppercase tracking-wider [writing-mode:vertical-lr] rotate-180">
              Progreso
            </span>
            <div className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center font-mono text-[10px] font-bold mt-1">
              {percent}%
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Sidebar Panel */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="pointer-events-auto w-64 bg-zinc-900 text-white rounded-l-3xl shadow-2xl border-l border-y border-red-600/30 overflow-hidden flex flex-col relative"
          >
            {/* Header banner */}
            <div className="bg-[#E61D25] p-3.5 flex items-center justify-between border-b border-red-600/20">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span className="font-display text-sm tracking-wide">Tu Progreso</span>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Sidebar content */}
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
              {/* Overall progress ring/bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-zinc-400">
                  <span>Completado</span>
                  <span className="text-white font-bold">{completedItems} / {totalItems}</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-[#E61D25] rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-400 text-right">
                  {percent}% listo
                </div>
              </div>

              {/* Group Checklist Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-display text-zinc-300">Fase de Grupos</span>
                  <span className="font-mono text-zinc-400">{groupStats.count}/12</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {GROUP_LETTERS.map((letter) => {
                    const isOk = groupStats.completed[letter]
                    return (
                      <div
                        key={letter}
                        className={cn(
                          'h-7 rounded-lg flex items-center justify-center font-display text-xs border transition-colors',
                          isOk
                            ? 'bg-emerald-950/45 border-emerald-600/60 text-emerald-400'
                            : 'bg-red-950/20 border-red-800/40 text-red-500'
                        )}
                        title={`Grupo ${letter}: ${isOk ? 'Completado' : 'Pendiente'}`}
                      >
                        {letter}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Knockout status */}
              <div className="bg-zinc-800/50 rounded-xl p-3 space-y-2 border border-zinc-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-display text-zinc-300 flex items-center gap-1.5">
                    <Layers size={13} className="text-red-500" /> Bracket Eliminatorias
                  </span>
                  <span className="font-mono font-bold text-red-500">{knockoutCount}/31</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Completa los 31 partidos de eliminación desde 32avos hasta la Gran Final.
                </p>
              </div>

              {/* Agnostic selections status */}
              <div className="space-y-2 pt-1 border-t border-zinc-800">
                <span className="font-display text-xs text-zinc-300">Selecciones Especiales</span>
                <div className="space-y-1.5">
                  {/* Champion */}
                  <div className="flex items-center justify-between text-xs bg-zinc-800/30 p-2 rounded-lg border border-zinc-800/50">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Trophy size={13} className={isChampionComplete ? 'text-amber-500' : 'text-zinc-500'} />
                      <span>Campeón Agnóstico</span>
                    </div>
                    {isChampionComplete ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <AlertCircle size={14} className="text-red-500 animate-pulse" />
                    )}
                  </div>

                  {/* Goleador */}
                  <div className="flex items-center justify-between text-xs bg-zinc-800/30 p-2 rounded-lg border border-zinc-800/50">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <User size={13} className={isGoleadorComplete ? 'text-amber-500' : 'text-zinc-500'} />
                      <span>Goleador Agnóstico</span>
                    </div>
                    {isGoleadorComplete ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <AlertCircle size={14} className="text-red-500 animate-pulse" />
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
