'use client'

import { motion } from 'framer-motion'
import { Coins, CheckCircle2, Clock } from 'lucide-react'
import type { Room, PaymentStatus } from '@/types/database'

interface PoolBannerProps {
  room: Room
  paidCount: number
  totalMembers: number
  myPaymentStatus: PaymentStatus
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  MXN: '$', USD: '$', EUR: '€', PEN: 'S/', COP: '$', ARS: '$', CLP: '$', BRL: 'R$',
}

export function PoolBanner({ room, paidCount, totalMembers, myPaymentStatus }: PoolBannerProps) {
  if (!room.pool_enabled) return null

  const symbol = CURRENCY_SYMBOLS[room.pool_currency] || '$'
  const potTotal = paidCount * room.pool_buy_in

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#C9A84C]/15 to-[#C9A84C]/5 dark:from-[#C9A84C]/10 dark:to-[#C9A84C]/[0.02] rounded-xl border border-[#C9A84C]/20">
        <div className="flex items-center gap-2">
          <Coins size={14} className="text-[#C9A84C] flex-shrink-0" />
          <div className="text-xs font-body">
            <span className="font-medium dark:text-white">Polla activa</span>
            <span className="text-gray-400 mx-1.5">·</span>
            <span className="text-gray-500 dark:text-gray-400">
              Entrada: <span className="font-mono">{symbol}{room.pool_buy_in.toLocaleString()}</span>
            </span>
            <span className="text-gray-400 mx-1.5 hidden sm:inline">·</span>
            <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">
              Pozo: <span className="font-mono font-bold text-[#C9A84C]">{symbol}{potTotal.toLocaleString()}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {myPaymentStatus === 'confirmed' ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-body font-medium px-2 py-0.5 rounded-full text-[#3CAC3B] bg-[#3CAC3B]/10">
              <CheckCircle2 size={10} /> Pagado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-body font-medium text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
              <Clock size={10} /> Pendiente
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
