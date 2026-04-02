'use client'

import { useState, useEffect } from 'react'
import { getCountdown } from '@/lib/utils/date'

export function useCountdown(targetDate: Date) {
  const [countdown, setCountdown] = useState(getCountdown(targetDate))

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(targetDate))
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  return countdown
}
