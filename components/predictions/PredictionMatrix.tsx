'use client'

import { useState, useTransition, useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Save, ChevronDown, Award, Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { StaggerContainer, StaggerItem } from '@/components/animations/PageTransition'
import { GroupPredictionCard } from './GroupPredictionCard'
import { CountdownTimer } from './CountdownTimer'
import { PredictionsTour } from './PredictionsTour'
import { KnockoutPredictions } from './KnockoutPredictions'
import { triggerWinConfetti } from '@/components/animations/ConfettiEffect'
import {
  saveGroupPrediction,
  saveAllGroupPredictions,
  saveAgnosticPredictions,
} from '@/app/actions/predictions'
import { GROUP_STAGE_DEADLINE, CHAMPION_GOLEADOR_DEADLINE } from '@/lib/constants/points'
import { TeamFlag } from '@/components/ui/TeamFlag'
import { GROUP_LETTERS, TEAMS } from '@/lib/constants/teams'
import { isBeforeDeadline } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import type { GroupLetter, GroupPrediction } from '@/types/database'

interface PredictionMatrixProps {
  roomId: string
  existingPredictions: Record<GroupLetter, GroupPrediction | null>
  existingKnockoutPredictions: Record<number, string>
  initialChampionId: string | null
  initialGoleador: string
}

type Selections = Record<GroupLetter, { first: string | null; second: string | null }>

// Helper to find team by ID
const findTeam = (id: string) => TEAMS.find((t) => t.id === id)
const TEAMS_BY_ID = Object.fromEntries(TEAMS.map((t) => [t.id, t]))

export function PredictionMatrix({
  roomId,
  existingPredictions,
  existingKnockoutPredictions,
  initialChampionId,
  initialGoleador,
}: PredictionMatrixProps) {
  const isOpen = isBeforeDeadline(GROUP_STAGE_DEADLINE)
  const isChampGoleadorOpen = isBeforeDeadline(CHAMPION_GOLEADOR_DEADLINE)

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

  // Agnostic choices states
  const [predictedChampionId, setPredictedChampionId] = useState<string | null>(initialChampionId)
  const [predictedGoleador, setPredictedGoleador] = useState<string>(initialGoleador)

  // Track what was last saved for agnostic auto-save
  const [savedChampionId, setSavedChampionId] = useState<string | null>(initialChampionId)
  const [savedGoleador, setSavedGoleador] = useState<string>(initialGoleador)
  const [agnosticAutoSaving, setAgnosticAutoSaving] = useState(false)

  // Champion combobox state
  const [championSearch, setChampionSearch] = useState('')
  const [showChampionDropdown, setShowChampionDropdown] = useState(false)
  const championComboboxRef = useRef<HTMLDivElement>(null)

  // Goleador combobox state
  const [goleadorSearch, setGoleadorSearch] = useState(initialGoleador)
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: string
      name: string
      position: string
      teamId: string
      teamName: string
      flagEmoji: string
    }>
  >([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [stars, setStars] = useState<
    Array<{
      id: string
      name: string
      position: string
      teamId: string
      teamName: string
      flagEmoji: string
    }>
  >([])
  const [selectedGoleadorTeamId, setSelectedGoleadorTeamId] = useState<string>('')
  const goleadorComboboxRef = useRef<HTMLDivElement>(null)

  // Sync state with props
  useEffect(() => {
    setPredictedChampionId(initialChampionId)
    setSavedChampionId(initialChampionId)
  }, [initialChampionId])

  useEffect(() => {
    setPredictedGoleador(initialGoleador)
    setGoleadorSearch(initialGoleador)
    setSavedGoleador(initialGoleador)
  }, [initialGoleador])

  // Fetch star players on mount
  useEffect(() => {
    async function fetchStars() {
      try {
        const res = await fetch('/api/players')
        const data = await res.json()
        if (data.players) {
          setStars(data.players)
          // If we have an initial goleador, try to find their flag
          if (initialGoleador) {
            const match = data.players.find((p: any) => p.name === initialGoleador)
            if (match) setSelectedGoleadorTeamId(match.teamId)
          }
        }
      } catch (err) {
        console.error('Error fetching stars:', err)
      }
    }
    fetchStars()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Also try to find goleador flag from search results
  useEffect(() => {
    if (predictedGoleador && searchResults.length > 0) {
      const match = searchResults.find((p) => p.name === predictedGoleador)
      if (match) setSelectedGoleadorTeamId(match.teamId)
    }
  }, [predictedGoleador, searchResults])

  // Goleador search debounce
  useEffect(() => {
    if (goleadorSearch.trim().length < 2) {
      setSearchResults([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      setLoadingPlayers(true)
      try {
        const res = await fetch(`/api/players?q=${encodeURIComponent(goleadorSearch)}`)
        const data = await res.json()
        if (data.players) {
          setSearchResults(data.players)
        }
      } catch (err) {
        console.error('Error fetching players:', err)
      } finally {
        setLoadingPlayers(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [goleadorSearch])

  // Click outside champion combobox to close
  useEffect(() => {
    const clickHandler = (e: MouseEvent) => {
      if (championComboboxRef.current && !championComboboxRef.current.contains(e.target as Node)) {
        setShowChampionDropdown(false)
      }
    }
    document.addEventListener('mousedown', clickHandler)
    return () => document.removeEventListener('mousedown', clickHandler)
  }, [])

  // Click outside goleador combobox to close
  useEffect(() => {
    const clickHandler = (e: MouseEvent) => {
      if (goleadorComboboxRef.current && !goleadorComboboxRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', clickHandler)
    return () => document.removeEventListener('mousedown', clickHandler)
  }, [])

  // ── Auto-save agnostic predictions ──────────────────────────────────
  useEffect(() => {
    if (!isChampGoleadorOpen) return
    const champChanged = predictedChampionId !== savedChampionId
    const goleadorChanged = predictedGoleador !== savedGoleador
    if (!champChanged && !goleadorChanged) return

    const timer = setTimeout(async () => {
      setAgnosticAutoSaving(true)
      try {
        const result = await saveAgnosticPredictions(roomId, predictedChampionId, predictedGoleador)
        if (result?.error) {
          toast.error(result.error)
        } else {
          setSavedChampionId(predictedChampionId)
          setSavedGoleador(predictedGoleador)
          toast.success('Predicciones especiales guardadas')
        }
      } catch {
        toast.error('Error guardando predicciones')
      } finally {
        setAgnosticAutoSaving(false)
      }
    }, 1500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predictedChampionId, predictedGoleador, roomId, isChampGoleadorOpen])

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

  const handleChange = useCallback(
    (letter: GroupLetter, first: string | null, second: string | null) => {
      setSelections((prev) => ({ ...prev, [letter]: { first, second } }))
    },
    []
  )

  const handleSaveSingle = useCallback(
    (letter: GroupLetter) => {
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
    },
    [roomId, selections]
  )

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
        toast.success(
          `${changedGroups.length} grupo${changedGroups.length > 1 ? 's' : ''} guardado${changedGroups.length > 1 ? 's' : ''}`
        )
      }
    })
  }

  // Filtered teams for champion search
  const filteredTeams =
    championSearch.trim().length > 0
      ? TEAMS.filter(
          (t) =>
            t.name.toLowerCase().includes(championSearch.toLowerCase()) ||
            t.code.toLowerCase().includes(championSearch.toLowerCase())
        )
      : TEAMS

  const selectedChampionTeam = predictedChampionId ? findTeam(predictedChampionId) : null

  return (
    <div className="space-y-6">
      <PredictionsTour />

      {/* ── Special Predictions Card ── */}
      <div className="glass-card p-4 sm:p-5 border-l-4 border-l-[#C9A84C] relative bg-gradient-to-r from-amber-50/50 to-white dark:from-amber-950/20 dark:to-zinc-900/50">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="text-[#C9A84C]" size={18} /> Mis Predicciones Especiales
            </h3>
            <p className="text-[11px] sm:text-xs font-body text-gray-500 mt-1">
              Elige al Campeón y al Goleador del Mundial, independiente de tu bracket.
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {' '}
                ¡Suma 15 y 10 puntos extra!
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {agnosticAutoSaving && (
              <span className="text-[10px] font-body text-amber-500 animate-pulse">Guardando…</span>
            )}
            <CountdownTimer
              deadline={CHAMPION_GOLEADOR_DEADLINE}
              label="Cierre elecciones"
              variant="compact"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Champion Combobox Selector */}
          <div className="space-y-1.5" ref={championComboboxRef}>
            <label className="block text-[11px] font-body font-semibold text-gray-700 dark:text-gray-300">
              🏆 Campeón del Mundo
            </label>
            <div className="relative">
              {/* Display selected champion or show search input */}
              {selectedChampionTeam && !showChampionDropdown ? (
                <button
                  type="button"
                  onClick={() => {
                    if (isChampGoleadorOpen) {
                      setShowChampionDropdown(true)
                      setChampionSearch('')
                    }
                  }}
                  disabled={!isChampGoleadorOpen}
                  className="w-full flex items-center gap-2 px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs sm:text-sm font-body text-gray-900 dark:text-white shadow-sm hover:border-[#C9A84C]/50 disabled:opacity-75 transition-colors text-left"
                >
                  <TeamFlag
                    flagCode={selectedChampionTeam.flag_code}
                    name={selectedChampionTeam.name}
                    size={18}
                  />
                  <span className="font-semibold">{selectedChampionTeam.name}</span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    ({selectedChampionTeam.code})
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    FIFA #{selectedChampionTeam.fifa_ranking}
                  </span>
                  {isChampGoleadorOpen && (
                    <ChevronDown size={12} className="ml-auto text-gray-400" />
                  )}
                </button>
              ) : (
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={championSearch}
                    onChange={(e) => {
                      setChampionSearch(e.target.value)
                      setShowChampionDropdown(true)
                    }}
                    onFocus={() => {
                      if (isChampGoleadorOpen) setShowChampionDropdown(true)
                    }}
                    placeholder="Buscar selección..."
                    disabled={!isChampGoleadorOpen}
                    autoFocus={showChampionDropdown}
                    className="w-full pl-9 pr-8 py-2 sm:py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs sm:text-sm font-body text-gray-900 dark:text-white shadow-sm focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] disabled:opacity-75 transition-colors"
                  />
                  {selectedChampionTeam && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowChampionDropdown(false)
                        setChampionSearch('')
                      }}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}

              {/* Champion Autocomplete Dropdown */}
              <AnimatePresence>
                {showChampionDropdown && isChampGoleadorOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute z-[60] w-full left-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 shadow-xl scrollbar-thin"
                  >
                    <div className="py-1 divide-y divide-gray-100 dark:divide-white/[0.04]">
                      {filteredTeams.length === 0 ? (
                        <div className="px-4 py-3 text-xs font-body text-gray-500">
                          No se encontraron selecciones.
                        </div>
                      ) : (
                        filteredTeams.map((team) => (
                          <button
                            key={team.id}
                            type="button"
                            onClick={() => {
                              setPredictedChampionId(team.id)
                              setShowChampionDropdown(false)
                              setChampionSearch('')
                            }}
                            className={cn(
                              'w-full text-left px-4 py-2.5 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors flex items-center gap-2.5 text-xs sm:text-sm font-body',
                              predictedChampionId === team.id
                                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300'
                                : 'text-gray-900 dark:text-white'
                            )}
                          >
                            <TeamFlag
                              flagCode={team.flag_code}
                              name={team.name}
                              size={18}
                              className="flex-shrink-0"
                            />
                            <span className="font-semibold">{team.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              #{team.fifa_ranking}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono ml-auto">
                              {team.code} · {team.group_letter}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Goleador Selector (Combobox) */}
          <div className="space-y-1.5" ref={goleadorComboboxRef}>
            <label className="block text-[11px] font-body font-semibold text-gray-700 dark:text-gray-300">
              ⚽ Goleador del Torneo (Bota de Oro)
            </label>
            <div className="relative">
              {/* If a goleador is selected and dropdown is not open, show display mode */}
              {predictedGoleador && !showDropdown ? (
                <button
                  type="button"
                  onClick={() => {
                    if (isChampGoleadorOpen) {
                      setShowDropdown(true)
                      setGoleadorSearch('')
                    }
                  }}
                  disabled={!isChampGoleadorOpen}
                  className="w-full flex items-center gap-2 px-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs sm:text-sm font-body text-gray-900 dark:text-white shadow-sm hover:border-[#C9A84C]/50 disabled:opacity-75 transition-colors text-left"
                >
                  {(() => {
                    const t = TEAMS_BY_ID[selectedGoleadorTeamId]
                    return t ? (
                      <TeamFlag flagCode={t.flag_code} name={t.name} size={18} />
                    ) : (
                      <span className="text-base">⚽</span>
                    )
                  })()}
                  <span className="font-semibold">{predictedGoleador}</span>
                  {isChampGoleadorOpen && (
                    <X
                      size={14}
                      className="ml-auto text-gray-400 hover:text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPredictedGoleador('')
                        setGoleadorSearch('')
                        setSelectedGoleadorTeamId('')
                        setShowDropdown(true)
                      }}
                    />
                  )}
                </button>
              ) : (
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={goleadorSearch}
                    onChange={(e) => {
                      if (!isChampGoleadorOpen) return
                      setGoleadorSearch(e.target.value)
                      setPredictedGoleador(e.target.value)
                      setSelectedGoleadorTeamId('')
                      setShowDropdown(true)
                    }}
                    onFocus={() => {
                      if (isChampGoleadorOpen) setShowDropdown(true)
                    }}
                    placeholder="Busca o escribe un jugador..."
                    disabled={!isChampGoleadorOpen}
                    autoFocus={showDropdown}
                    className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs sm:text-sm font-body text-gray-900 dark:text-white shadow-sm focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] disabled:opacity-75 transition-colors"
                  />
                </div>
              )}

              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {showDropdown && isChampGoleadorOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute z-[60] w-full left-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 shadow-xl scrollbar-thin"
                  >
                    {loadingPlayers && (
                      <div className="px-4 py-3 text-xs font-body text-gray-500 animate-pulse">
                        Buscando jugadores...
                      </div>
                    )}

                    {!loadingPlayers &&
                      searchResults.length === 0 &&
                      goleadorSearch.trim().length >= 2 && (
                        <div className="px-4 py-3 text-xs font-body text-gray-500">
                          No se encontraron coincidencias. Se guardará &quot;{goleadorSearch}&quot;.
                        </div>
                      )}

                    {!loadingPlayers &&
                      (searchResults.length > 0 ||
                        (goleadorSearch.trim().length < 2 && stars.length > 0)) && (
                        <div className="py-1.5 divide-y divide-gray-100 dark:divide-white/[0.04]">
                          <div className="px-3 py-1 text-[9px] font-semibold font-body text-amber-600 uppercase tracking-wider bg-amber-50/50 dark:bg-amber-950/10">
                            {searchResults.length > 0
                              ? 'Resultados de búsqueda'
                              : 'Estrellas Recomendadas'}
                          </div>
                          {(searchResults.length > 0 ? searchResults : stars).map((player) => (
                            <button
                              key={player.id}
                              type="button"
                              onClick={() => {
                                setGoleadorSearch(player.name)
                                setPredictedGoleador(player.name)
                                setSelectedGoleadorTeamId(player.teamId)
                                setShowDropdown(false)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors flex items-center justify-between text-xs sm:text-sm font-body text-gray-900 dark:text-white"
                            >
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const t = TEAMS_BY_ID[player.teamId]
                                  return t ? (
                                    <TeamFlag flagCode={t.flag_code} name={t.name} size={16} />
                                  ) : (
                                    <span className="text-sm">⚽</span>
                                  )
                                })()}
                                <span className="font-semibold">{player.name}</span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  ({player.teamId.toUpperCase()})
                                </span>
                              </div>
                              <span className="text-[9px] bg-gray-100 dark:bg-white/10 text-gray-500 px-1.5 py-0.5 rounded">
                                {player.position}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Progress + Countdown */}
      <div
        id="tour-progress"
        className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
      >
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-body text-gray-500">
              <span className="font-mono font-bold text-gray-900 dark:text-white">
                {savedCount}
              </span>
              /12 grupos guardados
            </p>
            <div className="flex items-center gap-2">
              {autoSaving && (
                <span className="text-[10px] font-body text-gray-400 animate-pulse">
                  Guardando…
                </span>
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
                        teams={TEAMS.filter((t) => t.group_letter === letter)}
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
      <div id="knockout-section" className="border-t border-gray-100 dark:border-white/[0.06] pt-6">
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
            className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-50"
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
