'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Copy, Check, ArrowLeft, Trophy, BarChart2, CalendarDays, GitCompareArrows, Network, Users, ChevronDown, X, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { PredictionMatrix } from '@/components/predictions/PredictionMatrix'
import { ResultsTab } from '@/components/predictions/ResultsTab'
import { BetSummary } from '@/components/predictions/BetSummary'
import { ComparisonView } from '@/components/predictions/ComparisonView'
import { BracketPopup } from '@/components/predictions/BracketPopup'
import { RealtimeRoom } from '@/components/groups/RealtimeRoom'
import { Modal } from '@/components/ui/Modal'
import { getWhatsAppShareUrl, getFacebookShareUrl, getTwitterShareUrl, getRoomShareUrl } from '@/lib/utils/rooms'
import { cn } from '@/lib/utils/cn'
import { GROUP_LETTERS } from '@/lib/constants/teams'
import type { Room, Profile, Match, GroupLetter, GroupPrediction } from '@/types/database'

interface RoomMemberWithProfile {
  user_id: string
  profile: Profile | null
  total_points: number
}

interface MemberPredictions {
  userId: string
  name: string
  groupPredictions: Record<GroupLetter, GroupPrediction | null>
  knockoutPredictions: Record<number, string>
}

interface GroupRoomProps {
  room: Room
  members: RoomMemberWithProfile[]
  groupPredictions: Record<GroupLetter, GroupPrediction | null>
  knockoutPredictions: Record<number, string>
  scorePredictions: Record<number, { home: number; away: number }>
  matches: Match[]
  currentUserId: string
  allMembersPredictions: MemberPredictions[]
}

type Tab = 'predictions' | 'results' | 'leaderboard' | 'comparison'

const TABS: { id: Tab; label: string; icon: typeof Trophy }[] = [
  { id: 'predictions', label: 'Apuestas', icon: Trophy },
  { id: 'results', label: 'Resultados', icon: CalendarDays },
  { id: 'leaderboard', label: 'Ranking', icon: BarChart2 },
  { id: 'comparison', label: 'Comparar', icon: GitCompareArrows },
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
  const [activeTab, setActiveTab] = useState<Tab>('predictions')
  const [copied, setCopied] = useState(false)
  const [showBracket, setShowBracket] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const shareMenuRef = useRef<HTMLDivElement>(null)

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
    const result: Record<string, { name: string; champion: string | null; runnerUp: string | null }> = {}
    for (const m of allMembersPredictions) {
      const champ = m.knockoutPredictions[103] ?? null
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
    const GROUP_LETTERS_ARR: GroupLetter[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
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

  return (
    <div className="space-y-4">
      {/* Realtime member join notifications */}
      <RealtimeRoom roomId={room.id} currentUserId={currentUserId} />

      {/* Back + Room header */}
      <div>
        <Link href="/groups" className="inline-flex items-center gap-1 text-xs font-body text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-3">
          <ArrowLeft size={12} /> Salas
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl dark:text-white">{room.name}</h2>
            {room.description && (
              <p className="text-sm text-gray-400 font-body mt-0.5">{room.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] font-mono text-gray-400 tracking-wider bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 rounded">{room.code}</span>
              <button
                onClick={() => setShowMembers((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-body text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/10 px-2.5 py-1 rounded-full transition-colors"
              >
                <Users size={12} />
                <span className="font-medium">{members.length}</span>
                <ChevronDown size={10} className={cn('transition-transform', showMembers && 'rotate-180')} />
              </button>
            </div>
          </div>
          <div className="flex gap-1.5">
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
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#1877F2]"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
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
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-gray-800 dark:fill-white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      </span>
                      X (Twitter)
                    </a>
                    <div className="border-t border-gray-100 dark:border-white/[0.06] my-1" />
                    <button
                      onClick={() => { handleCopyLink(); setShowShareMenu(false) }}
                      className="flex items-center gap-3 px-3 py-2 text-sm font-body hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors w-full"
                    >
                      <span className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                        {copied ? <Check size={14} className="text-[#3CAC3B]" /> : <Copy size={14} className="text-gray-400" />}
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
              <span className="text-[10px] font-body font-medium text-gray-400 uppercase tracking-wider">Miembros ({members.length}/10)</span>
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
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0',
                      isMe ? 'bg-[#2A398D] text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                    )}>
                      {member.profile?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          'text-sm font-body truncate dark:text-white',
                          isMe && 'font-medium text-[#2A398D] dark:text-blue-400'
                        )}>
                          {member.profile?.name || 'Anónimo'}
                        </span>
                        {isMe && <span className="text-[10px] text-gray-400 flex-shrink-0">(tú)</span>}
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
                      <span className="text-[10px] font-body font-medium text-[#3CAC3B] bg-[#3CAC3B]/10 px-2 py-0.5 rounded-full flex-shrink-0">Listo</span>
                    ) : (
                      <span className="text-[10px] font-body text-gray-400 bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full flex-shrink-0">Pendiente</span>
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
        knockoutPredictions={knockoutPredictions}
        allMembersPredictions={allMembersChampions}
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

      {/* Tab panels — all mounted, visibility toggled via CSS for speed */}
      <div className={activeTab === 'predictions' ? '' : 'hidden'}>
        <PredictionMatrix
          roomId={room.id}
          existingPredictions={groupPredictions}
          existingKnockoutPredictions={knockoutPredictions}
        />
      </div>

      <div className={activeTab === 'results' ? '' : 'hidden'}>
        <ResultsTab
          roomId={room.id}
          matches={matches}
          groupPredictions={groupPredictions}
          knockoutPredictions={knockoutPredictions}
          scorePredictions={scorePredictions}
        />
      </div>

      <div className={activeTab === 'leaderboard' ? '' : 'hidden'}>
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06]">
            <span className="text-xs font-display text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ranking de la Sala</span>
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
              const champPick = allMembersPredictions.find((m) => m.userId === member.user_id)?.knockoutPredictions[103]
              return (
                <div
                  key={member.user_id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-white/[0.04] last:border-0',
                    isMe && 'bg-[#2A398D]/[0.04] dark:bg-[#2A398D]/10'
                  )}
                >
                  <span className={cn(
                    'font-mono text-xs w-5 text-center font-bold',
                    idx === 0 ? 'text-[#C9A84C]' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-gray-400'
                  )}>
                    {idx + 1}
                  </span>
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0',
                    isMe ? 'bg-[#2A398D]' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                  )}>
                    {member.profile?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-sm font-body truncate dark:text-white', isMe && 'font-medium text-[#2A398D] dark:text-blue-400')}>
                        {member.profile?.name || 'Anónimo'}
                      </span>
                      {isMe && <span className="text-[10px] text-gray-400">(tú)</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isComplete ? (
                        <span className="text-[10px] font-body text-[#3CAC3B]">Apuestas completas</span>
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
                    <span className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300">{member.total_points}</span>
                    <span className="text-[10px] text-gray-400 ml-0.5">pts</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className={activeTab === 'comparison' ? '' : 'hidden'}>
        <ComparisonView
          currentUserId={currentUserId}
          allMembers={comparisonMembers}
        />
      </div>

      {/* Bracket Popup */}
      <Modal open={showBracket} onClose={() => setShowBracket(false)} title="Mi Bracket" size="lg">
        <div className="px-4 pb-4">
          <BracketPopup knockoutPredictions={knockoutPredictions} />
        </div>
      </Modal>
    </div>
  )
}
