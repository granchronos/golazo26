'use client'

import { useCountdown } from '@/lib/hooks/useCountdown'
import { cn } from '@/lib/utils/cn'
import { Clock } from 'lucide-react'

interface CountdownTimerProps {
  deadline: Date
  label?: string
  variant?: 'full' | 'compact'
}

export function CountdownTimer({ deadline, label = 'Cierre de apuestas', variant = 'full' }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, expired } = useCountdown(deadline)

  if (expired) {
    return (
      <div className={cn(
        'flex items-center gap-2 text-red-500 font-body',
        variant === 'compact' ? 'text-xs' : 'text-sm'
      )}>
        <Clock size={variant === 'compact' ? 12 : 16} />
        <span className="font-semibold">Apuestas cerradas</span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[#2A398D] font-body">
        <Clock size={11} />
        <span className="font-mono font-semibold">
          {days > 0 ? `${days}d ` : ''}{String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
    )
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={16} className="text-[#E61D25]" />
        <span className="text-sm font-body font-medium text-gray-600 dark:text-gray-300">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {days > 0 && (
          <TimeUnit value={days} label="días" urgent={false} />
        )}
        <TimeUnit value={hours} label="horas" urgent={days === 0 && hours < 6} />
        <span className="font-mono text-gray-400 font-bold text-xl mt-[-12px]">:</span>
        <TimeUnit value={minutes} label="min" urgent={days === 0 && hours === 0} />
        <span className="font-mono text-gray-400 font-bold text-xl mt-[-12px]">:</span>
        <TimeUnit value={seconds} label="seg" urgent={days === 0 && hours === 0 && minutes < 5} />
      </div>
    </div>
  )
}

function TimeUnit({ value, label, urgent }: { value: number; label: string; urgent: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className={cn(
        'font-mono font-bold text-2xl w-10 text-center',
        urgent ? 'text-[#E61D25]' : 'text-[#2A398D] dark:text-blue-400'
      )}>
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] font-body text-gray-400 uppercase tracking-wide">{label}</span>
    </div>
  )
}
