

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

export const ROUND_DEADLINES: Record<string, Date> = {
  round_of_32: new Date('2026-06-28T20:55:00+02:00'), // 20:55 España = 13:55 Perú
  round_of_16: new Date('2026-07-04T18:55:00+02:00'), // 18:55 España = 11:55 Perú
  quarter_finals: new Date('2026-07-09T21:55:00+02:00'), // 21:55 España = 14:55 Perú
  semi_finals: new Date('2026-07-14T20:55:00+02:00'), // 20:55 España = 13:55 Perú
  final: new Date('2026-07-19T20:55:00+02:00'), // 20:55 España = 13:55 Perú
}

export function getMatchPredictionDeadline(matchNumber: number, matchDate: string): Date {
  const matchDeadline = getMatchDeadline(matchDate)

  const earlier = (roundDeadline: Date) =>
    roundDeadline < matchDeadline ? roundDeadline : matchDeadline

  if (matchNumber >= 73 && matchNumber <= 88) return earlier(ROUND_DEADLINES.round_of_32)
  if (matchNumber >= 89 && matchNumber <= 96) return earlier(ROUND_DEADLINES.round_of_16)
  if (matchNumber >= 97 && matchNumber <= 100) return earlier(ROUND_DEADLINES.quarter_finals)
  if (matchNumber >= 101 && matchNumber <= 102) return earlier(ROUND_DEADLINES.semi_finals)
  if (matchNumber === 103) return earlier(ROUND_DEADLINES.final)

  return matchDeadline
}
