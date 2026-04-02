'use client'

import { useState, useTransition, useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Save, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { StaggerContainer, StaggerItem } from '@/components/animations/PageTransition'
import { GroupPredictionCard } from './GroupPredictionCard'
import { CountdownTimer } from './CountdownTimer'
import { PredictionsTour } from './PredictionsTour'
import { KnockoutPredictions } from './KnockoutPredictions'
import { triggerWinConfetti } from '@/components/animations/ConfettiEffect'
import { saveGroupPrediction, saveAllGroupPredictions } from '@/app/actions/predictions'
import { GROUP_STAGE_DEADLINE } from '@/lib/constants/points'
import { GROUP_LETTERS, TEAMS_BY_GROUP } from '@/lib/constants/teams'
import { isBeforeDeadline } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import type { GroupLetter, GroupPrediction } from '@/types/database'

interface PredictionMatrixProps {
  roomId: string
  existingPredictions: Record<GroupLetter, GroupPrediction | null>
  existingKnockoutPredictions: Record<number, string>
}

type Selections = Record<GroupLetter, { first: string | null; second: string | null }>

export function PredictionMatrix({
  roomId,
  existingPredictions,
  existingKnockoutPredictions,
}: PredictionMatrixProps) {
  const isOpen = isBeforeDeadline(GROUP_STAGE_DEADLINE)

  const [selections, setSelections] = useState<Selections>(() => {
    const init = {} as Selections
    for (const letter of GROUP_LETTERS) {
      init[letter] = {
        first: existingPredictions[letter]?.team_1st_id ?? null,
        second: existingPredictions[letter]?.team_2nd_id ?? null,
      }
    }
    return init
  })

  const [saved, setSaved] = useState<Selections>(() => {
    const init = {} as Selections
    for (const letter of GROUP_LETTERS) {
      init[letter] = {
        first: existingPredictions[letter]?.team_1st_id ?? null,
        second: existingPredictions[letter]?.team_2nd_id ?? null,
      }
    }
    return init
  })

  const [isPending, startTransition] = useTransition()
  const [autoSaving, setAutoSaving] = useState(false)
  const [groupsCollapsed, setGroupsCollapsed] = useState(false)

  // Keep a ref to saved so the auto-save effect doesn't need it in deps
  const savedRef = useRef(saved)
  savedRef.current = saved

  const changedGroups = GROUP_LETTERS.filter((g) => {
    const sel = selections[g]
    const sav = saved[g]
    return sel.first && sel.second && (sel.first !== sav.first || sel.second !== sav.second)
  })

  const savedCount = GROUP_LETTERS.filter((g) => saved[g].first && saved[g].second).length
  const pct = Math.round((savedCount / 12) * 100)

  // ── Auto-save group predictions ──────────────────────────────────
  useEffect(() => {
    const groupsToSave = GROUP_LETTERS.filter((g) => {
      const sel = selections[g]
      const sav = savedRef.current[g]
      return sel.first && sel.second && (sel.first !== sav.first || sel.second !== sav.second)
    })
    if (groupsToSave.length === 0) return
    if (!isOpen) return

    const timer = setTimeout(() => {
      const predictions = groupsToSave.map((g) => ({
        groupLetter: g,
        team1stId: selections[g].first!,
        team2ndId: selections[g].second!,
      }))

      setAutoSaving(true)
      startTransition(async () => {
        const result = await saveAllGroupPredictions(roomId, predictions)
        setAutoSaving(false)
        if (!result?.error) {
          setSaved((prev) => {
            const next = { ...prev }
            for (const g of groupsToSave) {
              next[g] = { first: selections[g].first, second: selections[g].second }
            }
            return next
          })
        }
      })
    }, 1500)

    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections, roomId, isOpen])

  const handleChange = useCallback((letter: GroupLetter, first: string | null, second: string | null) => {
    setSelections((prev) => ({ ...prev, [letter]: { first, second } }))
  }, [])

  const handleSaveSingle = useCallback((letter: GroupLetter) => {
    const sel = selections[letter]
    if (!sel.first || !sel.second) return
    startTransition(async () => {
      const result = await saveGroupPrediction(roomId, letter, sel.first!, sel.second!)
      if (result?.error) {
        toast.error(result.error)
      } else {
        setSaved((prev) => ({ ...prev, [letter]: { first: sel.first, second: sel.second } }))
        toast.success(`Grupo ${letter} guardado`)
      }
    })
  }, [roomId, selections])

  const handleSaveAll = () => {
    if (changedGroups.length === 0) return
    const predictions = changedGroups.map((g) => ({
      groupLetter: g,
      team1stId: selections[g].first!,
      team2ndId: selections[g].second!,
    }))
    startTransition(async () => {
      const result = await saveAllGroupPredictions(roomId, predictions)
      if (result?.error) {
        toast.error(result.error)
      } else {
        const newSaved = { ...saved }
        for (const g of changedGroups) {
          newSaved[g] = { first: selections[g].first, second: selections[g].second }
        }
        setSaved(newSaved)
        triggerWinConfetti()
        toast.success(`${changedGroups.length} grupo${changedGroups.length > 1 ? 's' : ''} guardado${changedGroups.length > 1 ? 's' : ''}`)
      }
    })
  }

  return (
    <div className="space-y-6">
      <PredictionsTour />

      {/* Progress + Countdown */}
      <div id="tour-progress" className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-body text-gray-500">
              <span className="font-mono font-bold text-gray-900 dark:text-white">{savedCount}</span>/12 grupos guardados
            </p>
            <div className="flex items-center gap-2">
              {autoSaving && (
                <span className="text-[10px] font-body text-gray-400 animate-pulse">Guardando…</span>
              )}
              <span className="text-xs font-mono text-gray-400">{pct}%</span>
            </div>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2A398D] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="sm:border-l sm:border-gray-100 dark:sm:border-white/10 sm:pl-4">
          <CountdownTimer deadline={GROUP_STAGE_DEADLINE} label="Cierre grupos" variant="compact" />
        </div>
      </div>

      {/* Group grid section */}
      <div>
        <button
          onClick={() => setGroupsCollapsed((v) => !v)}
          className="flex items-center gap-2 mb-3 group"
        >
          <span className="font-display text-base dark:text-white">Fase de Grupos</span>
          <ChevronDown
            size={14}
            className={cn(
              'text-gray-400 transition-transform duration-200',
              groupsCollapsed && '-rotate-90'
            )}
          />
        </button>

        <AnimatePresence initial={false}>
          {!groupsCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {GROUP_LETTERS.map((letter) => (
                  <StaggerItem key={letter}>
                    <div id={`group-${letter}`}>
                      <GroupPredictionCard
                        groupLetter={letter}
                        teams={TEAMS_BY_GROUP[letter] || []}
                        first={selections[letter].first}
                        second={selections[letter].second}
                        savedFirst={saved[letter].first}
                        savedSecond={saved[letter].second}
                        onChange={(f, s) => handleChange(letter, f, s)}
                        onSave={() => handleSaveSingle(letter)}
                        isSaving={isPending}
                        isOpen={isOpen}
                      />
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Knockout predictions section */}
      <div className="border-t border-gray-100 dark:border-white/[0.06] pt-6">
        <KnockoutPredictions
          roomId={roomId}
          groupSelections={selections}
          existingPredictions={existingKnockoutPredictions}
        />
      </div>

      {/* Floating global save button (manual fallback) */}
      <AnimatePresence>
        {changedGroups.length > 0 && !autoSaving && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-40"
          >
            <button
              id="tour-save-all"
              onClick={handleSaveAll}
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#2A398D] text-white font-body font-semibold text-sm shadow-lg shadow-[#2A398D]/30 hover:bg-[#1e2b6e] disabled:opacity-50 transition-all"
            >
              <Save size={16} />
              {isPending
                ? 'Guardando...'
                : `Guardar ${changedGroups.length} grupo${changedGroups.length > 1 ? 's' : ''}`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
