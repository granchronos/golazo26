'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Share2, Copy, Check, ArrowLeft, Trophy, BarChart2, CalendarDays, GitCompareArrows, Network } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { PredictionMatrix } from '@/components/predictions/PredictionMatrix'
import { ResultsTab } from '@/components/predictions/ResultsTab'
import { BetSummary } from '@/components/predictions/BetSummary'
import { ComparisonView } from '@/components/predictions/ComparisonView'
import { BracketPopup } from '@/components/predictions/BracketPopup'
import { RealtimeRoom } from '@/components/groups/RealtimeRoom'
import { Modal } from '@/components/ui/Modal'
import { getWhatsAppShareUrl, getRoomShareUrl } from '@/lib/utils/rooms'
import { cn } from '@/lib/utils/cn'
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getRoomShareUrl(room.invite_slug))
    setCopied(true)
    toast.success('Link copiado')
    setTimeout(() => setCopied(false), 2000)
  }

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
              <span className="text-xs text-gray-400 font-body">{members.length} miembros</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowBracket(true)}
              className="p-2 rounded-lg bg-[#2A398D]/10 hover:bg-[#2A398D]/20 transition-colors"
              title="Mi Bracket"
            >
              <Network size={14} className="text-[#2A398D]" />
            </button>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              {copied ? <Check size={14} className="text-[#3CAC3B]" /> : <Copy size={14} className="text-gray-400" />}
            </button>
            <a
              href={getWhatsAppShareUrl(room.invite_slug, room.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors"
            >
              <Share2 size={14} className="text-[#25D366]" />
            </a>
          </div>
        </div>
      </div>

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
          {sortedMembers.map((member, idx) => {
            const isMe = member.user_id === currentUserId
            return (
              <div
                key={member.user_id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-white/[0.04] last:border-0',
                  isMe && 'bg-[#2A398D]/[0.04] dark:bg-[#2A398D]/10'
                )}
              >
                <span className="font-mono text-xs text-gray-400 w-5">{idx + 1}</span>
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0',
                  isMe ? 'bg-[#2A398D]' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                )}>
                  {member.profile?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <span className={cn('flex-1 text-sm font-body truncate dark:text-white', isMe && 'font-medium text-[#2A398D] dark:text-blue-400')}>
                  {member.profile?.name || 'Anónimo'} {isMe && <span className="text-xs text-gray-400">(tú)</span>}
                </span>
                <span className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300">{member.total_points}</span>
                <span className="text-[10px] text-gray-400">pts</span>
              </div>
            )
          })}
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
