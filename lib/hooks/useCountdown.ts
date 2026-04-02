'use client'

import { useState, useEffect } from 'react'
import { getCountdown } from '@/lib/utils/date'

export function useCountdown(targetDate: Date) {
  // Initialize with zeros to avoid hydration mismatch (server vs client time diff)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCountdown(getCountdown(targetDate))
    const interval = setInterval(() => {
      setCountdown(getCountdown(targetDate))
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  return { ...countdown, mounted }
}
