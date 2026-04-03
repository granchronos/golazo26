'use client'

import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Room, PoolSplit, PaymentStatus } from '@/types/database'

interface RankedMember {
  user_id: string
  name: string
  total_points: number
  payment_status: PaymentStatus
  rank: number
}

interface PrizeBreakdownProps {
  room: Room
  rankedMembers: RankedMember[]
  currentUserId: string
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  MXN: '$', USD: '$', EUR: '€', PEN: 'S/', COP: '$', ARS: '$', CLP: '$', BRL: 'R$',
}

const MEDALS = ['🥇', '🥈', '🥉']
const PODIUM_COLORS = [
  'from-[#C9A84C]/20 to-[#C9A84C]/5 border-[#C9A84C]/30',
  'from-gray-200/50 to-gray-100/20 dark:from-white/10 dark:to-white/[0.02] border-gray-300/30 dark:border-white/10',
  'from-amber-700/10 to-amber-600/5 border-amber-700/20',
]

export function PrizeBreakdown({ room, rankedMembers, currentUserId }: PrizeBreakdownProps) {
  const symbol = CURRENCY_SYMBOLS[room.pool_currency] || '$'
  const poolSplit = Array.isArray(room.pool_split)
    ? (room.pool_split as unknown as PoolSplit[])
    : []

  // Only count paid + exempt for pot calculation (exempt = admin who doesn't pay in)
  const paidMembers = rankedMembers.filter((m) => m.payment_status === 'confirmed')
  const potTotal = paidMembers.length * room.pool_buy_in

  if (paidMembers.length < 3 || room.pool_buy_in === 0) {
    return (
      <div className="text-center py-6 text-sm font-body text-gray-400">
        <Trophy size={24} className="mx-auto mb-2 text-gray-300 dark:text-white/10" />
        Se necesitan al menos 3 pagos confirmados para calcular premios
      </div>
    )
  }

  // Calculate prizes handling ties
  const prizes = calculatePrizes(rankedMembers, poolSplit, potTotal)
  const myPrize = prizes.find((p) => p.user_id === currentUserId)
  const myRank = rankedMembers.find((m) => m.user_id === currentUserId)?.rank ?? 0

  return (
    <div className="space-y-3">
      {/* Personal highlight */}
      {myPrize && myPrize.amount > 0 && (
        <div className="bg-gradient-to-r from-[#C9A84C]/15 to-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-xl p-3 text-center">
          <p className="text-xs font-body text-gray-500 dark:text-gray-400">
            Estás en {myRank}° lugar — ganarías
          </p>
          <p className="text-xl font-mono font-bold text-[#C9A84C] mt-0.5">
            {symbol}{myPrize.amount.toLocaleString()}
          </p>
        </div>
      )}

      {/* Prize table */}
      <div className="space-y-1.5">
        {poolSplit.map((s, idx) => {
          // Find all members at this place
          const membersAtPlace = prizes.filter((p) => p.place === s.place)
          const prizeAmount = Math.round(potTotal * s.pct / 100)

          return (
            <div
              key={s.place}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-xl border bg-gradient-to-r',
                idx < 3 ? PODIUM_COLORS[idx] : 'from-gray-50 to-transparent dark:from-white/[0.04] border-gray-100 dark:border-white/[0.06]'
              )}
            >
              <span className="text-lg w-8 text-center">{MEDALS[idx] || `${s.place}°`}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-medium dark:text-white">
                  {s.place}° lugar ({s.pct}%)
                </p>
                {membersAtPlace.length > 0 && (
                  <p className="text-xs font-body text-gray-400 truncate">
                    {membersAtPlace.map((m) => m.name).join(', ')}
                    {membersAtPlace.length > 1 && ' (empate)'}
                  </p>
                )}
              </div>
              <span className="font-mono font-bold text-sm dark:text-white flex-shrink-0">
                {symbol}{prizeAmount.toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-[10px] font-body text-gray-400 text-center">
        Pozo total: {symbol}{potTotal.toLocaleString()} {room.pool_currency} · {paidMembers.length} pagos confirmados
      </p>
    </div>
  )
}

function calculatePrizes(
  ranked: RankedMember[],
  split: PoolSplit[],
  potTotal: number
): { user_id: string; name: string; place: number; amount: number }[] {
  const result: { user_id: string; name: string; place: number; amount: number }[] = []
  const maxPlace = Math.max(...split.map((s) => s.place))

  // Group members by rank to handle ties
  const rankGroups = new Map<number, RankedMember[]>()
  for (const m of ranked) {
    const existing = rankGroups.get(m.rank) || []
    existing.push(m)
    rankGroups.set(m.rank, existing)
  }

  // Assign prizes
  const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b)
  let currentPlace = 1

  for (const rank of sortedRanks) {
    if (currentPlace > maxPlace) break
    const membersAtRank = rankGroups.get(rank)!
    const placesOccupied = membersAtRank.length

    // Sum all prizes for the places these tied members occupy
    let totalPrize = 0
    for (let p = currentPlace; p < currentPlace + placesOccupied && p <= maxPlace; p++) {
      const splitEntry = split.find((s) => s.place === p)
      if (splitEntry) totalPrize += Math.round(potTotal * splitEntry.pct / 100)
    }

    const perMember = Math.round(totalPrize / placesOccupied)
    for (const m of membersAtRank) {
      result.push({
        user_id: m.user_id,
        name: m.name,
        place: currentPlace,
        amount: perMember,
      })
    }

    currentPlace += placesOccupied
  }

  return result
}
