import {
  ROUND_OF_32_DEADLINE,
  ROUND_OF_16_DEADLINE,
  QUARTER_FINALS_DEADLINE,
  SEMI_FINALS_DEADLINE,
  FINAL_DEADLINE,
} from '@/lib/constants/points'

export function formatMatchDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })
}

export function getCountdown(targetDate: Date): {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
} {
  const now = new Date().getTime()
  const target = targetDate.getTime()
  const diff = target - now

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, expired: false }
}

export function isBeforeDeadline(deadline: Date): boolean {
  return new Date() < deadline
}

export function getMatchDeadline(matchDate: string): Date {
  const date = new Date(matchDate)
  date.setMinutes(date.getMinutes() - 5) // 5 min before kickoff
  return date
}

export function getMatchPredictionDeadline(matchNumber: number, matchDate: string): Date {
  const matchDeadline = getMatchDeadline(matchDate)

  // Helper: return the earlier of the round deadline or the per-match deadline
  const earlier = (roundDeadline: Date) =>
    roundDeadline < matchDeadline ? roundDeadline : matchDeadline

  if (matchNumber >= 73 && matchNumber <= 88) return earlier(ROUND_OF_32_DEADLINE)    // R32
  if (matchNumber >= 89 && matchNumber <= 96) return earlier(ROUND_OF_16_DEADLINE)    // R16
  if (matchNumber >= 97 && matchNumber <= 100) return earlier(QUARTER_FINALS_DEADLINE) // QF
  if (matchNumber >= 101 && matchNumber <= 102) return earlier(SEMI_FINALS_DEADLINE)   // SF
  if (matchNumber === 103) return earlier(FINAL_DEADLINE)                              // Final

  // Group stage and others: 5 minutes before kickoff
  return matchDeadline
}
