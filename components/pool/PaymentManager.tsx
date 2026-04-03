'use client'

import { useTransition } from 'react'
import { CheckCircle2, XCircle, Shield, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import { confirmPayment, revokePayment } from '@/app/actions/pool'
import type { Profile, Room, PaymentStatus, PoolSplit } from '@/types/database'

interface MemberWithPayment {
  user_id: string
  profile: Profile | null
  total_points: number
  payment_status: PaymentStatus
}

interface PaymentManagerProps {
  room: Room
  members: MemberWithPayment[]
  currentUserId: string
  isAdmin: boolean
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  MXN: '$', USD: '$', EUR: '€', PEN: 'S/', COP: '$', ARS: '$', CLP: '$', BRL: 'R$',
}

export function PaymentManager({ room, members, currentUserId, isAdmin }: PaymentManagerProps) {
  const [isPending, startTransition] = useTransition()

  const symbol = CURRENCY_SYMBOLS[room.pool_currency] || '$'
  const paidCount = members.filter((m) => m.payment_status === 'confirmed' || m.payment_status === 'exempt').length
  const potTotal = members.filter((m) => m.payment_status === 'confirmed').length * room.pool_buy_in
  const poolSplit = Array.isArray(room.pool_split)
    ? (room.pool_split as unknown as PoolSplit[])
    : []

  const handleConfirm = (memberId: string) => {
    startTransition(async () => {
      const res = await confirmPayment(room.id, memberId)
      if (res.error) toast.error(res.error)
      else toast.success('Pago confirmado')
    })
  }

  const handleRevoke = (memberId: string) => {
    startTransition(async () => {
      const res = await revokePayment(room.id, memberId)
      if (res.error) toast.error(res.error)
      else toast.success('Pago revocado')
    })
  }

  // Sort: admin first, then confirmed, then pending
  const sorted = [...members].sort((a, b) => {
    const order: Record<PaymentStatus, number> = { exempt: 0, confirmed: 1, pending: 2 }
    return order[a.payment_status] - order[b.payment_status]
  })

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 flex items-center justify-between bg-gradient-to-r from-[#C9A84C]/10 to-[#C9A84C]/5 dark:from-[#C9A84C]/[0.08] dark:to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
              <DollarSign size={18} className="text-[#C9A84C]" />
            </div>
            <div>
              <p className="text-sm font-body font-medium dark:text-white">
                {paidCount}/{members.length} pagados
              </p>
              <p className="text-xs font-body text-gray-400">
                Entrada: {symbol}{room.pool_buy_in.toLocaleString()} {room.pool_currency}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-mono font-bold text-[#C9A84C]">
              {symbol}{potTotal.toLocaleString()}
            </p>
            <p className="text-[10px] font-body text-gray-400 uppercase tracking-wider">Pozo</p>
          </div>
        </div>
      </div>

      {/* Prize distribution */}
      {paidCount >= 3 && room.pool_buy_in > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06]">
            <span className="text-xs font-display text-gray-500 dark:text-gray-400 uppercase tracking-wide">Premios</span>
          </div>
          <div className="p-3 space-y-1.5">
            {poolSplit.map((s) => {
              const prize = Math.round(potTotal * s.pct / 100)
              const medals = ['🥇', '🥈', '🥉']
              return (
                <div key={s.place} className="flex items-center justify-between py-1">
                  <span className="text-sm font-body text-gray-600 dark:text-gray-300">
                    {medals[s.place - 1] || `${s.place}°`} {s.place}° lugar
                    <span className="text-gray-400 ml-1">({s.pct}%)</span>
                  </span>
                  <span className="font-mono font-bold text-sm text-gray-700 dark:text-gray-200">
                    {symbol}{prize.toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {paidCount < 3 && room.pool_buy_in > 0 && (
        <div className="text-center py-3 text-xs font-body text-gray-400 bg-gray-50 dark:bg-white/[0.04] rounded-xl">
          Se necesitan al menos 3 pagos para mostrar premios
        </div>
      )}

      {/* Member list */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06]">
          <span className="text-xs font-display text-gray-500 dark:text-gray-400 uppercase tracking-wide">Pagos</span>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
          {sorted.map((member) => {
            const isMe = member.user_id === currentUserId
            const isRoomAdmin = member.payment_status === 'exempt'
            return (
              <div
                key={member.user_id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3',
                  isMe && 'bg-[#2A398D]/[0.04] dark:bg-[#2A398D]/10'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
                  isMe ? 'bg-[#2A398D] text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
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
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isRoomAdmin ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-body font-medium text-[#2A398D] bg-[#2A398D]/10 px-2 py-0.5 rounded-full">
                      <Shield size={10} /> Admin
                    </span>
                  ) : member.payment_status === 'confirmed' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-body font-medium text-[#3CAC3B] bg-[#3CAC3B]/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={10} /> Pagado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-body font-medium text-gray-400 bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full">
                      <XCircle size={10} /> Pendiente
                    </span>
                  )}
                  {isAdmin && !isRoomAdmin && (
                    <button
                      onClick={() =>
                        member.payment_status === 'confirmed'
                          ? handleRevoke(member.user_id)
                          : handleConfirm(member.user_id)
                      }
                      disabled={isPending}
                      className={cn(
                        'text-[10px] font-body font-medium px-2.5 py-1 rounded-lg transition-colors',
                        member.payment_status === 'confirmed'
                          ? 'text-[#E61D25] bg-[#E61D25]/10 hover:bg-[#E61D25]/20'
                          : 'text-[#3CAC3B] bg-[#3CAC3B]/10 hover:bg-[#3CAC3B]/20'
                      )}
                    >
                      {member.payment_status === 'confirmed' ? 'Revocar' : 'Confirmar'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
