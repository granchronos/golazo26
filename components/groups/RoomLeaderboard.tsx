'use client'

import { useMemo } from 'react'
import { Trophy, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { TEAMS } from '@/lib/constants/teams'
import { TeamFlag } from '@/components/ui/TeamFlag'
import type { Profile, PaymentStatus } from '@/types/database'

interface RoomMemberWithProfile {
  user_id: string
  profile: Profile | null
  total_points: number
  group_points: number
  knockout_points: number
  correct_predictions: number
  payment_status: PaymentStatus
  predicted_champion_id?: string | null
  predicted_goleador?: string | null
}

interface MemberPredictions {
  userId: string
  name: string
  knockoutPredictions: Record<number, string>
}

interface ScorerData {
  scorers: Array<{
    player: { id: number; name: string }
    team: { name?: string; tla?: string }
    goals: number
  }>
  players: Array<{ id: string; name: string; teamId: string }>
}

interface RoomLeaderboardProps {
  sortedMembers: RoomMemberWithProfile[]
  allMembersPredictions: MemberPredictions[]
  currentUserId: string
  roomPoolEnabled: boolean
  memberProgress: Record<string, { groups: number; knockout: number; total: number }>
  scorersData: ScorerData | null
  matchedGoleadores: Record<string, { flagCode: string; flagEmoji: string; teamName: string; goals: number }>
  onSelectMember: (userId: string) => void
}

export function RoomLeaderboard({
  sortedMembers,
  allMembersPredictions,
  currentUserId,
  roomPoolEnabled,
  memberProgress,
  scorersData,
  matchedGoleadores,
  onSelectMember,
}: RoomLeaderboardProps) {
  return (
    <>
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
            const isComplete = groupsDone === 12 && knockoutDone >= 32
            const bracketChamp = allMembersPredictions.find((m) => m.userId === member.user_id)
              ?.knockoutPredictions[103]
            const champPick = bracketChamp || member.predicted_champion_id
            return (
              <div
                key={member.user_id}
                onClick={() => onSelectMember(member.user_id)}
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
                        {groupsDone}/12 grupos · {knockoutDone}/32 llaves
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
                  <div className="flex items-center gap-1 mt-0.5 justify-end">
                    {member.correct_predictions > 0 && (
                      <span className="text-[9px] font-mono text-[#3CAC3B] bg-[#3CAC3B]/10 px-1 py-0.5 rounded flex items-center gap-0.5">
                        <Check size={8} />
                        {member.correct_predictions}
                      </span>
                    )}
                    {member.group_points > 0 && (
                      <span className="text-[9px] font-mono text-[#2A398D] bg-[#2A398D]/10 px-1 py-0.5 rounded">
                        G{member.group_points}
                      </span>
                    )}
                    {member.knockout_points > 0 && (
                      <span className="text-[9px] font-mono text-[#C9A84C] bg-[#C9A84C]/10 px-1 py-0.5 rounded">
                        K{member.knockout_points}
                      </span>
                    )}
                  </div>
                  {roomPoolEnabled && (
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
        <TopGoleadores scorers={scorersData.scorers} />
      )}

      {/* Goleadores Predichos por la Sala */}
      <PredictedGoleadores
        sortedMembers={sortedMembers}
        currentUserId={currentUserId}
        matchedGoleadores={matchedGoleadores}
      />
    </>
  )
}

function TopGoleadores({
  scorers,
}: {
  scorers: NonNullable<ScorerData>['scorers']
}) {
  return (
    <div className="glass-card overflow-hidden mt-4">
      <div className="px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-b border-gray-100 dark:border-white/[0.06]">
        <span className="text-xs font-display text-amber-700 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
          ⚽ Top Goleadores del Mundial 2026
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-500/15 text-green-600 dark:text-green-400 animate-pulse">EN VIVO</span>
        </span>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
        {scorers.slice(0, 15).map((scorer, idx) => {
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
  )
}

function PredictedGoleadores({
  sortedMembers,
  currentUserId,
  matchedGoleadores,
}: {
  sortedMembers: RoomMemberWithProfile[]
  currentUserId: string
  matchedGoleadores: Record<string, { flagCode: string; flagEmoji: string; teamName: string; goals: number }>
}) {
  return (
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
  )
}
