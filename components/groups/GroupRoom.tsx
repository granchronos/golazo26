'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Share2,
  Copy,
  Check,
  ArrowLeft,
  Trophy,
  BarChart2,
  CalendarDays,
  GitCompareArrows,
  Network,
  Users,
  ChevronDown,
  X,
  MessageCircle,
  Coins,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PredictionMatrix } from '@/components/predictions/PredictionMatrix'
import { ResultsTab } from '@/components/predictions/ResultsTab'
import { BetSummary } from '@/components/predictions/BetSummary'
import { ComparisonView } from '@/components/predictions/ComparisonView'
import { BracketPopup } from '@/components/predictions/BracketPopup'
import { RealtimeRoom } from '@/components/groups/RealtimeRoom'
import { PoolConfigButton } from '@/components/pool/PoolConfigPanel'
import { PoolBanner } from '@/components/pool/PoolBanner'
import { PaymentManager } from '@/components/pool/PaymentManager'
import { PrizeBreakdown } from '@/components/pool/PrizeBreakdown'
import { ProgressSidebar } from '@/components/predictions/ProgressSidebar'
import { KnockoutDeadlineBanner } from '@/components/predictions/KnockoutDeadlineBanner'
import { Modal } from '@/components/ui/Modal'
import {
  getWhatsAppShareUrl,
  getFacebookShareUrl,
  getTwitterShareUrl,
  getRoomShareUrl,
} from '@/lib/utils/rooms'
import { cn } from '@/lib/utils/cn'
import { GROUP_LETTERS, TEAMS } from '@/lib/constants/teams'
import { TeamFlag } from '@/components/ui/TeamFlag'
import type {
  Room,
  Profile,
  Match,
  GroupLetter,
  GroupPrediction,
  PaymentStatus,
} from '@/types/database'

interface RoomMemberWithProfile {
  user_id: string
  profile: Profile | null
  total_points: number
  payment_status: PaymentStatus
  predicted_champion_id?: string | null
  predicted_goleador?: string | null
}

interface MemberPredictions {
  userId: string
  name: string
  groupPredictions: Record<GroupLetter, GroupPrediction | null>
  knockoutPredictions: Record<number, string>
  scorePredictions: Record<number, { home: number; away: number; tieBreaker: string | null; homePenalty: number | null; awayPenalty: number | null }>
  predictedChampionId: string | null
  predictedGoleador: string | null
}

interface GroupRoomProps {
  room: Room
  members: RoomMemberWithProfile[]
  groupPredictions: Record<GroupLetter, GroupPrediction | null>
  knockoutPredictions: Record<number, string>
  scorePredictions: Record<number, { home: number; away: number; tieBreaker: string | null; homePenalty: number | null; awayPenalty: number | null }>
  matches: Match[]
  currentUserId: string
  allMembersPredictions: MemberPredictions[]
}

type Tab = 'predictions' | 'results' | 'leaderboard' | 'comparison' | 'pool'

const BASE_TABS: { id: Tab; label: string; icon: typeof Trophy }[] = [
  { id: 'results', label: 'Resultados', icon: CalendarDays },
  { id: 'predictions', label: 'Apuestas', icon: Trophy },
  { id: 'leaderboard', label: 'Ranking', icon: BarChart2 },
  // { id: 'comparison', label: 'Comparar', icon: GitCompareArrows }, // Temporarily hidden
]

export function GroupRoom({
  room,
  members,
  groupPredictions,
  knockoutPredictions,
  scorePredictions,
  matches,
  currentUserId,
  allMembersPredictions,
}: GroupRoomProps) {
  const [activeTab, setActiveTab] = useState<Tab>('results')
  const [copied, setCopied] = useState(false)
  const [showBracket, setShowBracket] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const shareMenuRef = useRef<HTMLDivElement>(null)

  const [viewingUserId, setViewingUserId] = useState<string>(currentUserId)

  const [scorersData, setScorersData] = useState<{ scorers: any[]; players: any[] } | null>(null)

  // Track which match IDs have been seen as 'finished' to detect new completions
  const prevFinishedRef = useRef<Set<string>>(
    new Set(matches.filter((m) => m.status === 'finished').map((m) => m.id))
  )

  // Reusable scorers loader
  const loadScorers = useCallback(async () => {
    try {
      const res = await fetch('/api/live-scores/scorers')
      if (res.ok) {
        const data = await res.json()
        setScorersData(data)
      }
    } catch (err) {
      console.error('Failed to load scorers', err)
    }
  }, [])

  // Fetch scorers on mount + poll every 2 minutes
  useEffect(() => {
    loadScorers()
    const interval = setInterval(loadScorers, 120_000) // every 2 min
    return () => clearInterval(interval)
  }, [loadScorers])

  // Immediately refetch scorers when a match transitions to 'finished'
  useEffect(() => {
    const currentFinished = new Set(
      matches.filter((m) => m.status === 'finished').map((m) => m.id)
    )
    const prev = prevFinishedRef.current

    // Check if there are newly finished matches
    const hasNew = Array.from(currentFinished).some((id) => !prev.has(id))

    prevFinishedRef.current = currentFinished

    if (hasNew) {
      // Small delay to give the API time to update scorer stats after the match ends
      const timeout = setTimeout(loadScorers, 5_000)
      return () => clearTimeout(timeout)
    }
  }, [matches, loadScorers])

  // Match member predictions to flags and goals
  const matchedGoleadores = useMemo(() => {
    if (!scorersData) return {}

    const { scorers, players } = scorersData
    const result: Record<
      string,
      {
        flagCode: string
        flagEmoji: string
        teamName: string
        goals: number
      }
    > = {}

    // Helper to normalize strings for comparison
    const normalize = (str: string) => {
      if (!str) return ''
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
    }

    // List of national teams to resolve API team names/TLAs
    const findTeamByTlaOrName = (tlaOrName: string) => {
      const norm = normalize(tlaOrName)
      if (!norm) return null
      return TEAMS.find(
        (t) =>
          normalize(t.code) === norm ||
          normalize(t.name) === norm ||
          normalize(t.id) === norm
      )
    }

    for (const member of members) {
      const pick = member.predicted_goleador
      if (!pick) continue

      const pickNorm = normalize(pick)

      // 1. Try to find the player in our database players list
      const dbPlayer = players.find((p: any) => {
        const pNorm = normalize(p.name)
        return pNorm.includes(pickNorm) || pickNorm.includes(pNorm)
      })

      // 2. Try to find the player in the API's top scorers list
      const apiScorer = scorers.find((s: any) => {
        const sNorm = normalize(s.player.name)
        return sNorm.includes(pickNorm) || pickNorm.includes(sNorm)
      })

      // 3. Extract goals
      const goals = apiScorer ? apiScorer.goals : 0

      // 4. Resolve flag and team details
      let flagCode = ''
      let flagEmoji = '⚽'
      let teamName = ''

      if (dbPlayer) {
        // Look up team details in our local TEAMS array using teamId
        const teamObj = TEAMS.find((t) => t.id === dbPlayer.teamId)
        if (teamObj) {
          flagCode = teamObj.flag_code
          flagEmoji = teamObj.flag_emoji
          teamName = teamObj.name
        }
      } else if (apiScorer) {
        // Fallback: resolve from API team details
        const teamObj = findTeamByTlaOrName(apiScorer.team.tla || apiScorer.team.name)
        if (teamObj) {
          flagCode = teamObj.flag_code
          flagEmoji = teamObj.flag_emoji
          teamName = teamObj.name
        }
      }

      result[pick] = {
        flagCode,
        flagEmoji,
        teamName,
        goals,
      }
    }

    return result
  }, [scorersData, members])

  const isAdmin = room.admin_id === currentUserId

  const activeGroupPredictions = viewingUserId === currentUserId 
    ? groupPredictions 
    : (allMembersPredictions.find((m) => m.userId === viewingUserId)?.groupPredictions ?? ({} as any))

  const activeKnockoutPredictions = viewingUserId === currentUserId 
    ? knockoutPredictions 
    : (allMembersPredictions.find((m) => m.userId === viewingUserId)?.knockoutPredictions ?? {})

  const activeScorePredictions = viewingUserId === currentUserId
    ? scorePredictions
    : (allMembersPredictions.find((m) => m.userId === viewingUserId)?.scorePredictions ?? {})

  const viewingMember = members.find((m) => m.user_id === viewingUserId)
  const activeChampionId = viewingMember?.predicted_champion_id || null
  const activeGoleador = viewingMember?.predicted_goleador || ''

  const isViewingOther = viewingUserId !== currentUserId



  const TABS = useMemo(() => {
    const tabs = [...BASE_TABS]
    if (room.pool_enabled) {
      tabs.push({ id: 'pool', label: 'Porra', icon: Coins })
    }
    return tabs
  }, [room.pool_enabled])

  // Close share menu on outside click
  useEffect(() => {
    if (!showShareMenu) return
    const handler = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showShareMenu])

  const router = useRouter()

  // Auto refresh room data every minute to fetch new members/scores
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 60000)
    return () => clearInterval(interval)
  }, [router])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getRoomShareUrl(room.invite_slug))
    setCopied(true)
    toast.success('Link copiado')
    setTimeout(() => setCopied(false), 2000)
  }

  // Compute prediction progress per member
  const memberProgress = useMemo(() => {
    const result: Record<string, { groups: number; knockout: number; total: number }> = {}
    for (const m of allMembersPredictions) {
      const groups = GROUP_LETTERS.filter((l) => m.groupPredictions[l] != null).length
      const knockout = Object.keys(m.knockoutPredictions).length
      result[m.userId] = { groups, knockout, total: groups + knockout }
    }
    return result
  }, [allMembersPredictions])

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => b.total_points - a.total_points),
    [members]
  )

  // BetSummary: all members' champion picks
  const allMembersChampions = useMemo(() => {
    const result: Record<
      string,
      { name: string; champion: string | null; runnerUp: string | null }
    > = {}
    for (const m of allMembersPredictions) {
      const explicitChamp = m.predictedChampionId || null
      const bracketChamp = m.knockoutPredictions[103] || null
      const champ = explicitChamp || bracketChamp
      const sf1 = m.knockoutPredictions[101] ?? null
      const sf2 = m.knockoutPredictions[102] ?? null
      let runnerUp: string | null = null
      if (champ && sf1 && sf2) {
        runnerUp = champ === sf1 ? sf2 : champ === sf2 ? sf1 : null
      }
      result[m.userId] = { name: m.name, champion: champ, runnerUp }
    }
    return result
  }, [allMembersPredictions])

  // ComparisonView data
  const comparisonMembers = useMemo(() => {
    const GROUP_LETTERS_ARR: GroupLetter[] = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
    ]
    return allMembersPredictions.map((m) => {
      const hasAllGroups = GROUP_LETTERS_ARR.every((l) => m.groupPredictions[l] != null)
      const hasChampion = !!m.knockoutPredictions[103]
      return {
        userId: m.userId,
        name: m.name,
        groupPredictions: m.groupPredictions,
        knockoutPredictions: m.knockoutPredictions,
        isComplete: hasAllGroups && hasChampion,
      }
    })
  }, [allMembersPredictions])

  const groupSelections = useMemo(() => {
    const init = {} as Record<GroupLetter, { first: string | null; second: string | null }>
    for (const letter of GROUP_LETTERS) {
      init[letter] = {
        first: groupPredictions[letter]?.team_1st_id ?? null,
        second: groupPredictions[letter]?.team_2nd_id ?? null,
      }
    }
    return init
  }, [groupPredictions])

  return (
    <div className="space-y-4">
      {/* Realtime member join notifications */}
      <RealtimeRoom roomId={room.id} currentUserId={currentUserId} />

      {/* Back + Room header */}
      <div>
        <Link
          href="/groups"
          className="inline-flex items-center gap-1 text-xs font-body text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-3"
        >
          <ArrowLeft size={12} /> Salas
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl dark:text-white">{room.name}</h2>
            {room.description && (
              <p className="text-sm text-gray-400 font-body mt-0.5">{room.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] font-mono text-gray-400 tracking-wider bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 rounded">
                {room.code}
              </span>
              <button
                onClick={() => setShowMembers((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-body text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/10 px-2.5 py-1 rounded-full transition-colors"
              >
                <Users size={12} />
                <span className="font-medium">{members.length}</span>
                <ChevronDown
                  size={10}
                  className={cn('transition-transform', showMembers && 'rotate-180')}
                />
              </button>
            </div>
          </div>
          <div className="flex gap-1.5">
            {isAdmin && <PoolConfigButton room={room} />}
            <button
              onClick={() => setShowBracket(true)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-[#2A398D]/10 hover:bg-[#2A398D]/20 transition-colors"
              title="Mi Bracket"
            >
              <Network size={16} className="text-[#2A398D]" />
            </button>
            <div className="relative" ref={shareMenuRef}>
              <button
                onClick={() => setShowShareMenu((v) => !v)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                title="Compartir"
              >
                <Share2 size={16} className="text-gray-400" />
              </button>
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute right-0 top-full mt-1 w-[calc(100vw-2rem)] sm:w-52 max-w-[13rem] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-white/10 py-1.5 z-50"
                  >
                    <a
                      href={getWhatsAppShareUrl(room.invite_slug, room.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2 text-sm font-body hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <span className="w-7 h-7 rounded-full bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
                        <MessageCircle size={14} className="text-[#25D366]" />
                      </span>
                      WhatsApp
                    </a>
                    <a
                      href={getFacebookShareUrl(room.invite_slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2 text-sm font-body hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <span className="w-7 h-7 rounded-full bg-[#1877F2]/10 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#1877F2]">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </span>
                      Facebook
                    </a>
                    <a
                      href={getTwitterShareUrl(room.invite_slug, room.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2 text-sm font-body hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <span className="w-7 h-7 rounded-full bg-black/[0.06] dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-3.5 h-3.5 fill-gray-800 dark:fill-white"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </span>
                      X (Twitter)
                    </a>
                    <div className="border-t border-gray-100 dark:border-white/[0.06] my-1" />
                    <button
                      onClick={() => {
                        handleCopyLink()
                        setShowShareMenu(false)
                      }}
                      className="flex items-center gap-3 px-3 py-2 text-sm font-body hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors w-full"
                    >
                      <span className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                        {copied ? (
                          <Check size={14} className="text-[#3CAC3B]" />
                        ) : (
                          <Copy size={14} className="text-gray-400" />
                        )}
                      </span>
                      Copiar link
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable member list */}
      <AnimatePresence>
        {showMembers && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-gray-100 dark:border-white/[0.06]">
              <span className="text-[10px] font-body font-medium text-gray-400 uppercase tracking-wider">
                Miembros ({members.length}/10)
              </span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {members.map((member) => {
                const isMe = member.user_id === currentUserId
                const progress = memberProgress[member.user_id]
                const groupsDone = progress?.groups ?? 0
                const knockoutDone = progress?.knockout ?? 0
                const isComplete = groupsDone === 12 && knockoutDone >= 31
                return (
                  <div key={member.user_id} className="flex items-center gap-2.5 px-3 py-2.5">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0',
                        isMe
                          ? 'bg-[#2A398D] text-white'
                          : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {member.profile?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'text-sm font-body truncate dark:text-white',
                            isMe && 'font-medium text-[#2A398D] dark:text-blue-400'
                          )}
                        >
                          {member.profile?.name || 'Anónimo'}
                        </span>
                        {isMe && (
                          <span className="text-[10px] text-gray-400 flex-shrink-0">(tú)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-gray-400">
                          Grupos {groupsDone}/12
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span className="text-[10px] font-mono text-gray-400">
                          Llaves {knockoutDone}/31
                        </span>
                      </div>
                    </div>
                    {isComplete ? (
                      <span className="text-[10px] font-body font-medium text-[#3CAC3B] bg-[#3CAC3B]/10 px-2 py-0.5 rounded-full flex-shrink-0">
                        Listo
                      </span>
                    ) : (
                      <span className="text-[10px] font-body text-gray-400 bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full flex-shrink-0">
                        Pendiente
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Champion / Runner-up summary */}
      <BetSummary
        knockoutPredictions={activeKnockoutPredictions}
        allMembersPredictions={allMembersChampions}
        predictedChampionId={activeChampionId}
        predictedGoleador={activeGoleador}
      />

      {/* Pool banner */}
      {room.pool_enabled && (
        <PoolBanner
          room={room}
          paidCount={members.filter((m) => m.payment_status === 'confirmed').length}
          totalMembers={members.length}
          myPaymentStatus={
            members.find((m) => m.user_id === currentUserId)?.payment_status ?? 'pending'
          }
        />
      )}

      {/* Progress Tracker Modal */}
      <AnimatePresence>
        {showProgress && (
          <Modal open={showProgress} onClose={() => setShowProgress(false)}>
            <div className="p-4 sm:p-6 bg-gray-50 dark:bg-zinc-900 rounded-2xl max-w-md w-full mx-auto relative">
              <button
                onClick={() => setShowProgress(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              <h3 className="font-display text-lg mb-4 dark:text-white">Tu Progreso</h3>
              <ProgressSidebar
                groupPredictions={activeGroupPredictions}
                knockoutPredictions={activeKnockoutPredictions}
                predictedChampionId={activeChampionId}
                predictedGoleador={activeGoleador}
              />
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Global Knockout Deadline Banner */}
      <KnockoutDeadlineBanner
        existingKnockoutPredictions={activeKnockoutPredictions}
        isReadOnly={isViewingOther}
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/[0.04] rounded-xl">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex-1 flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-body font-medium rounded-lg transition-colors',
                activeTab === tab.id ? 'text-gray-900 dark:text-white' : 'text-gray-400'
              )}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="room-tab"
                  className="absolute inset-0 bg-white dark:bg-white/10 rounded-lg shadow-sm"
                />
              )}
              <Icon size={14} className="relative z-10" />
              <span className="relative z-10 hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {isViewingOther && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-center justify-between">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Viendo predicciones de <strong>{viewingMember?.profile?.name}</strong> (Solo lectura)
          </p>
          <button
            onClick={() => setViewingUserId(currentUserId)}
            className="text-xs font-semibold px-3 py-1.5 bg-amber-200/50 hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/40 rounded-lg transition-colors"
          >
            Volver a mi perfil
          </button>
        </div>
      )}

      {/* Tab panels — all mounted, visibility toggled via CSS for speed */}
      <div className={activeTab === 'predictions' ? '' : 'hidden'}>
        <PredictionMatrix
          key={viewingUserId}
          roomId={room.id}
          existingPredictions={activeGroupPredictions}
          existingKnockoutPredictions={activeKnockoutPredictions}
          initialChampionId={activeChampionId}
          initialGoleador={activeGoleador}
          isReadOnly={isViewingOther}
        />
      </div>

      <div className={activeTab === 'results' ? '' : 'hidden'}>
        <ResultsTab
          key={viewingUserId}
          roomId={room.id}
          matches={matches}
          groupPredictions={activeGroupPredictions}
          knockoutPredictions={activeKnockoutPredictions}
          scorePredictions={activeScorePredictions}
          allMembersPredictions={allMembersPredictions}
          isAdmin={isAdmin}
          actualGoleador={room.actual_goleador}
          isReadOnly={isViewingOther}
        />
      </div>

      <div className={activeTab === 'leaderboard' ? '' : 'hidden'}>
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06]">
            <span className="text-xs font-display text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Ranking de la Sala
            </span>
          </div>
          {sortedMembers.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Trophy size={24} className="mx-auto mb-2 text-gray-300 dark:text-white/10" />
              <p className="text-sm font-body text-gray-400">No hay miembros aún</p>
            </div>
          ) : (
            sortedMembers.map((member, idx) => {
              const isMe = member.user_id === currentUserId
              const progress = memberProgress[member.user_id]
              const groupsDone = progress?.groups ?? 0
              const knockoutDone = progress?.knockout ?? 0
              const isComplete = groupsDone === 12 && knockoutDone >= 31
              const bracketChamp = allMembersPredictions.find((m) => m.userId === member.user_id)
                ?.knockoutPredictions[103]
              const champPick = bracketChamp || member.predicted_champion_id
              return (
                <div
                  key={member.user_id}
                  onClick={() => {
                    setViewingUserId(member.user_id)
                    setActiveTab('predictions')
                  }}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-white/[0.04] last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors',
                    isMe && 'bg-[#2A398D]/[0.04] dark:bg-[#2A398D]/10'
                  )}
                >
                  <span
                    className={cn(
                      'font-mono text-xs w-5 text-center font-bold',
                      idx === 0
                        ? 'text-[#C9A84C]'
                        : idx === 1
                          ? 'text-gray-400'
                          : idx === 2
                            ? 'text-amber-700'
                            : 'text-gray-400'
                    )}
                  >
                    {idx + 1}
                  </span>
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0',
                      isMe
                        ? 'bg-[#2A398D]'
                        : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {member.profile?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'text-sm font-body truncate dark:text-white',
                          isMe && 'font-medium text-[#2A398D] dark:text-blue-400'
                        )}
                      >
                        {member.profile?.name || 'Anónimo'}
                      </span>
                      {isMe && <span className="text-[10px] text-gray-400">(tú)</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isComplete ? (
                        <span className="text-[10px] font-body text-[#3CAC3B]">
                          Apuestas completas
                        </span>
                      ) : (
                        <span className="text-[10px] font-body text-gray-400">
                          {groupsDone}/12 grupos · {knockoutDone}/31 llaves
                        </span>
                      )}
                      {champPick && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">·</span>
                          <span className="text-[10px]">🏆 {champPick.toUpperCase()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300">
                      {member.total_points}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-0.5">pts</span>
                    {room.pool_enabled && (
                      <div className="mt-0.5">
                        {member.payment_status === 'confirmed' ? (
                          <span className="text-[9px] text-[#C9A84C]">💰</span>
                        ) : (
                          <span className="text-[9px] text-gray-300 dark:text-gray-600">
                            sin pago
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Top Goleadores del Mundial - Live from API */}
        {scorersData && scorersData.scorers.length > 0 && (
          <div className="glass-card overflow-hidden mt-4">
            <div className="px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-b border-gray-100 dark:border-white/[0.06]">
              <span className="text-xs font-display text-amber-700 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                ⚽ Top Goleadores del Mundial 2026
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-500/15 text-green-600 dark:text-green-400 animate-pulse">EN VIVO</span>
              </span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {scorersData.scorers.slice(0, 15).map((scorer: any, idx: number) => {
                const teamObj = TEAMS.find(
                  (t) =>
                    t.code.toLowerCase() === (scorer.team?.tla || '').toLowerCase() ||
                    t.name.toLowerCase() === (scorer.team?.name || '').toLowerCase()
                )
                return (
                  <div key={scorer.player?.id || idx} className="flex items-center gap-3 px-4 py-2.5">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                      idx === 0 ? 'bg-amber-500 text-white' :
                      idx === 1 ? 'bg-gray-300 dark:bg-gray-600 text-white' :
                      idx === 2 ? 'bg-orange-400 text-white' :
                      'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                    )}>
                      {idx + 1}
                    </span>
                    {teamObj ? (
                      <TeamFlag
                        flagCode={teamObj.flag_code}
                        name={teamObj.name}
                        size={18}
                        className="flex-shrink-0"
                      />
                    ) : (
                      <span className="text-sm flex-shrink-0">🏳️</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-body font-medium text-gray-900 dark:text-white truncate block">
                        {scorer.player?.name}
                      </span>
                      <span className="text-[10px] font-body text-gray-400">
                        {teamObj?.name || scorer.team?.name || ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={cn(
                        'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold font-mono',
                        idx === 0
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                          : 'bg-[#2A398D]/10 text-[#2A398D] dark:bg-white/10 dark:text-white'
                      )}>
                        {scorer.goals} {scorer.goals === 1 ? 'gol' : 'goles'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Goleadores Predichos por la Sala */}
        <div className="glass-card overflow-hidden mt-4">
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06]">
            <span className="text-xs font-display text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              🎯 Predicciones de Goleador
            </span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
            {[...sortedMembers]
              .sort((a, b) => {
                const goalsA = (a.predicted_goleador ? matchedGoleadores[a.predicted_goleador]?.goals : 0) ?? 0
                const goalsB = (b.predicted_goleador ? matchedGoleadores[b.predicted_goleador]?.goals : 0) ?? 0
                return goalsB - goalsA
              })
              .map((member) => {
              const goleadorPick = member.predicted_goleador
              const matchInfo = goleadorPick ? matchedGoleadores[goleadorPick] : null
              return (
                <div key={member.user_id} className="flex items-center gap-3 px-4 py-2.5">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0',
                      member.user_id === currentUserId
                        ? 'bg-[#2A398D]'
                        : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {member.profile?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-body truncate dark:text-white">
                      {member.profile?.name || 'Anónimo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 justify-end ml-auto flex-shrink-0">
                    {goleadorPick ? (
                      <>
                        {matchInfo?.flagCode ? (
                          <TeamFlag
                            flagCode={matchInfo.flagCode}
                            name={matchInfo.teamName}
                            size={16}
                            className="flex-shrink-0"
                          />
                        ) : (
                          <span className="text-xs">{matchInfo?.flagEmoji || '⚽'}</span>
                        )}
                        <span className="text-sm font-body font-medium text-gray-900 dark:text-white">
                          {goleadorPick}
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2A398D]/10 text-[#2A398D] dark:bg-white/10 dark:text-white ml-1.5 font-mono">
                          {matchInfo?.goals ?? 0} {(matchInfo?.goals ?? 0) === 1 ? 'gol' : 'goles'}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-body text-gray-400 dark:text-gray-500">
                        Ninguno
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className={activeTab === 'comparison' ? '' : 'hidden'}>
        <ComparisonView currentUserId={currentUserId} allMembers={comparisonMembers} />
      </div>

      {room.pool_enabled && (
        <div className={activeTab === 'pool' ? '' : 'hidden'}>
          <div className="space-y-4">
            <PaymentManager
              room={room}
              members={members.map((m) => ({
                user_id: m.user_id,
                profile: m.profile,
                total_points: m.total_points,
                payment_status: m.payment_status,
              }))}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
            <PrizeBreakdown
              room={room}
              rankedMembers={sortedMembers.map((m, idx) => ({
                user_id: m.user_id,
                name: m.profile?.name || 'Anónimo',
                total_points: m.total_points,
                payment_status: m.payment_status,
                rank: idx + 1,
              }))}
              currentUserId={currentUserId}
            />

            {/* Detailed Points Rules Card */}
            <div className="glass-card p-5 border-l-4 border-l-[#2A398D] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#2A398D]/5 rounded-full blur-xl pointer-events-none" />
              <h3 className="font-display text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                📊 Sistema de Puntaje
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-body text-gray-600 dark:text-gray-300">
                <div className="space-y-3">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">
                      Predicción de Marcador (Por Partido):
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-1">
                      <li>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          Signo (1/X/2):
                        </span>{' '}
                        +3 pts si aciertas quién gana o empate.
                      </li>
                      <li>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          Aproximación:
                        </span>{' '}
                        0 a 4+ pts extra por cercanía al resultado real.
                      </li>
                      <li>
                        <span className="font-bold text-yellow-600 dark:text-yellow-500">
                          Ejemplo:
                        </span>{' '}
                        Partido 4-2, apuesta 3-1 = 6 pts (3 signo + 3 aprox).
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">
                      Clasificados de Grupos (Standings):
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-1">
                      <li>
                        <span className="font-bold text-[#2A398D] dark:text-blue-400">
                          5 Puntos:
                        </span>{' '}
                        Por cada equipo que clasifique en la posición exacta (1.° o 2.°) que
                        predijiste en tu grupo.
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">
                      Team Bets (derivado de tu bracket):
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-1">
                      <div>
                        • Llega a Octavos:{' '}
                        <span className="font-bold text-gray-900 dark:text-white">5 pts</span>
                      </div>
                      <div>
                        • Llega a Cuartos:{' '}
                        <span className="font-bold text-gray-900 dark:text-white">10 pts</span>
                      </div>
                      <div>
                        • Llega a Semis:{' '}
                        <span className="font-bold text-gray-900 dark:text-white">15 pts</span>
                      </div>
                      <div>
                        • Llega a Final:{' '}
                        <span className="font-bold text-gray-900 dark:text-white">25 pts</span>
                      </div>
                      <div className="col-span-2">
                        • Campeón:{' '}
                        <span className="font-bold text-gray-900 dark:text-white">50 pts</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">
                      Rondas Eliminatorias (Ganador de Partido):
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-1">
                      <div>
                        • Ronda de 32:{' '}
                        <span className="font-bold text-gray-900 dark:text-white">10 pts</span>
                      </div>
                      <div>
                        • Octavos de Final:{' '}
                        <span className="font-bold text-gray-900 dark:text-white">15 pts</span>
                      </div>
                      <div>
                        • Cuartos de Final:{' '}
                        <span className="font-bold text-gray-900 dark:text-white">20 pts</span>
                      </div>
                      <div>
                        • Semifinales:{' '}
                        <span className="font-bold text-gray-900 dark:text-white">50 pts</span>
                      </div>
                      <div className="col-span-2">
                        • Final:{' '}
                        <span className="font-bold text-gray-900 dark:text-white">100 pts</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white mb-1">
                      Predicciones Especiales (Sección Extra):
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-1">
                      <li>
                        <span className="font-bold text-[#C9A84C]">15 Puntos:</span> Acierto al
                        Campeón del Mundo.
                      </li>
                      <li>
                        <span className="font-bold text-[#C9A84C]">10 Puntos:</span> Acierto al
                        Goleador del torneo.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bracket Popup */}
      <Modal open={showBracket} onClose={() => setShowBracket(false)} title="Mi Bracket" size="xl">
        <BracketPopup
          groupSelections={groupSelections}
          knockoutPredictions={knockoutPredictions}
          userName={members.find((m) => m.user_id === currentUserId)?.profile?.name}
        />
      </Modal>

      {/* Floating Progress Bubble */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowProgress(true)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[45] w-14 h-14 bg-white dark:bg-zinc-800 rounded-full shadow-xl flex items-center justify-center border border-gray-100 dark:border-white/10"
      >
        <div className="relative">
          <Trophy size={24} className="text-[#3CAC3B]" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-zinc-800" />
        </div>
      </motion.button>
    </div>
  )
}
