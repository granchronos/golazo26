'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiEffectProps {
  trigger: boolean
  onComplete?: () => void
}

export function ConfettiEffect({ trigger, onComplete }: ConfettiEffectProps) {
  useEffect(() => {
    if (!trigger) return

    const duration = 2500
    const end = Date.now() + duration

    const colors = ['#2A398D', '#E61D25', '#3CAC3B', '#C9A84C', '#F7F5F0']

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      } else {
        onComplete?.()
      }
    }

    frame()
  }, [trigger, onComplete])

  return null
}

export function triggerWinConfetti() {
  const colors = ['#2A398D', '#E61D25', '#C9A84C', '#3CAC3B']

  confetti({
    particleCount: 150,
    spread: 90,
    origin: { y: 0.6 },
    colors,
    zIndex: 9999,
  })
}
