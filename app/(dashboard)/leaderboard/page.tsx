import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PageTransition } from '@/components/animations/PageTransition'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export const metadata = { title: 'Ranking Global' }

const MEDALS = ['🥇', '🥈', '🥉']
const PODIUM_COLORS = ['bg-[#C9A84C]', 'bg-gray-400', 'bg-[#CD7F32]']

async function getLeaderboard() {
  const admin = await createAdminClient()

  const { data } = await admin
    .from('scores')
    .select(`
      total_points,
      correct_predictions,
      user_id,
      profiles!inner(name, avatar_url)
    `)
    .order('total_points', { ascending: false })
    .limit(50)

  return data || []
}

export default async function LeaderboardPage() {
  const [supabase, entries] = await Promise.all([
    createClient().then(s => s.auth.getUser().then(({ data: { user } }) => user)),
    getLeaderboard(),
  ])

  const user = supabase
  const myRank = entries.findIndex((e) => e.user_id === user!.id) + 1

  return (
    <PageTransition>
      <div className="mb-6">
        <p className="text-sm text-gray-400 font-body mb-1">
          {myRank > 0 ? `Tu posición: #${myRank}` : 'Ranking global'}
        </p>
        <h1 className="font-display text-3xl md:text-4xl dark:text-white">Ranking</h1>
      </div>

      {/* Top 3 */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[entries[1], entries[0], entries[2]].map((entry, idx) => {
            if (!entry) return null
            const realIdx = idx === 0 ? 1 : idx === 1 ? 0 : 2
            const profile = entry.profiles as unknown as { name: string; avatar_url: string | null }
            return (
              <div
                key={entry.user_id}
                className={cn(
                  'glass-card p-3 flex flex-col items-center text-center',
                  idx === 1 && 'sm:-mt-3'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold font-body mb-1.5',
                  PODIUM_COLORS[realIdx],
                )}>
                  {profile?.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-base leading-none mb-1">{MEDALS[realIdx]}</span>
                <p className="text-xs font-body font-medium dark:text-white truncate w-full">{profile?.name}</p>
                <p className="font-mono text-lg font-bold text-[#2A398D] dark:text-blue-400 mt-0.5">{entry.total_points}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {entries.length === 0 && (
          <div className="text-center py-16 text-gray-300 dark:text-gray-600 font-body">
            <Trophy size={40} className="mx-auto mb-3" />
            <p className="text-sm">Sé el primero en hacer sus apuestas</p>
          </div>
        )}
        {entries.map((entry, idx) => {
          const profile = entry.profiles as unknown as { name: string; avatar_url: string | null }
          const isMe = entry.user_id === user!.id
          return (
            <div
              key={entry.user_id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-white/[0.04] last:border-0',
                isMe && 'bg-[#2A398D]/[0.04] dark:bg-[#2A398D]/10'
              )}
            >
              {/* Rank */}
              <div className="w-7 flex-shrink-0 text-center">
                {idx < 3 ? (
                  <span className="text-base">{MEDALS[idx]}</span>
                ) : (
                  <span className="font-mono text-xs text-gray-400">{idx + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0',
                isMe ? 'bg-[#2A398D]' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
              )}>
                {profile?.name?.[0]?.toUpperCase()}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-body truncate dark:text-white',
                  isMe && 'font-medium text-[#2A398D] dark:text-blue-400'
                )}>
                  {profile?.name} {isMe && <span className="text-xs text-gray-400">(tú)</span>}
                </p>
              </div>

              {/* Points */}
              <div className="flex-shrink-0">
                <span className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300">
                  {entry.total_points}
                </span>
                <span className="text-[10px] text-gray-400 ml-1">pts</span>
              </div>
            </div>
          )
        })}
      </div>
    </PageTransition>
  )
}
