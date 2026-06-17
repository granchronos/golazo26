'use client'

import { useEffect, useState } from 'react'

interface LocalTimeProps {
  dateStr: string
  mode?: 'full' | 'short' | 'time' | 'date'
  className?: string
}

export function LocalTime({ dateStr, mode = 'full', className }: LocalTimeProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR Fallback (renders on server to prevent hydration issues)
  const getFallbackText = () => {
    try {
      const d = new Date(dateStr)
      // Format as DD MMM in UTC for server fallback
      const day = d.getUTCDate()
      const months = [
        'Ene',
        'Feb',
        'Mar',
        'Abr',
        'May',
        'Jun',
        'Jul',
        'Ago',
        'Sep',
        'Oct',
        'Nov',
        'Dic',
      ]
      const month = months[d.getUTCMonth()]
      const hour = String(d.getUTCHours()).padStart(2, '0')
      const min = String(d.getUTCMinutes()).padStart(2, '0')

      if (mode === 'short') return `${day} ${month}`
      if (mode === 'time') return `${hour}:${min} UTC`
      if (mode === 'date') return `${day} ${month} ${d.getUTCFullYear()}`
      return `${day} ${month} · ${hour}:${min} UTC`
    } catch {
      return ''
    }
  }

  if (!mounted) {
    return <span className={className}>{getFallbackText()}</span>
  }

  try {
    const d = new Date(dateStr)
    let formatted = ''

    if (mode === 'full') {
      formatted = d.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    } else if (mode === 'short') {
      formatted = d.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
      })
    } else if (mode === 'time') {
      formatted = d.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } else if (mode === 'date') {
      formatted = d.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    }

    return <span className={className}>{formatted}</span>
  } catch (error) {
    return <span className={className}>{getFallbackText()}</span>
  }
}
