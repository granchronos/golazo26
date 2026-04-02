'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const TOUR_KEY = 'golazo26_predictions_tour_v2'

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

const STEPS = [
  {
    target: '#tour-progress',
    title: 'Tu progreso',
    description: 'Aquí ves cuántos grupos has guardado y el tiempo restante.',
    position: 'below' as const,
  },
  {
    target: '#tour-team-list',
    title: 'Elige 1° y 2°',
    description: 'Toca un equipo para elegirlo como 1° (dorado). Toca otro para el 2° (azul).',
    position: 'below' as const,
  },
  {
    target: '#group-A',
    title: 'Guarda por grupo',
    description: 'Al elegir 1° y 2°, aparece "Guardar grupo" al final de la tarjeta.',
    position: 'below' as const,
  },
  {
    target: '#group-B',
    title: 'O guarda todo junto',
    description: 'Llena varios grupos y un botón flotante te permite guardarlos todos de una vez.',
    position: 'above' as const,
  },
]

export function PredictionsTour() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<SpotlightRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const measureTarget = useCallback(() => {
    const target = document.querySelector(STEPS[step]?.target)
    if (!target) return
    const r = target.getBoundingClientRect()
    const pad = 6
    setRect({
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    })
    // Scroll target into view
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [step])

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      // Small delay to let DOM render
      const timer = setTimeout(() => setVisible(true), 600)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    measureTarget()
    window.addEventListener('resize', measureTarget)
    window.addEventListener('scroll', measureTarget, true)
    return () => {
      window.removeEventListener('resize', measureTarget)
      window.removeEventListener('scroll', measureTarget, true)
    }
  }, [visible, step, measureTarget])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(TOUR_KEY, '1')
  }

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      dismiss()
    }
  }

  if (!visible || !rect) return null

  const current = STEPS[step]

  // Tooltip position relative to viewport
  const tooltipY = current.position === 'below'
    ? rect.top + rect.height + 12
    : rect.top - 12

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[100]" style={{ pointerEvents: 'none' }}>
          {/* SVG overlay with cutout */}
          <svg
            className="fixed inset-0 w-full h-full"
            style={{ pointerEvents: 'auto' }}
            onClick={dismiss}
          >
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <motion.rect
                  initial={{ opacity: 0 }}
                  animate={{
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    opacity: 1,
                  }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  rx={12}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.55)"
              mask="url(#spotlight-mask)"
            />
            {/* Animated ring around spotlight */}
            <motion.rect
              initial={{ opacity: 0 }}
              animate={{
                x: rect.left - 2,
                y: rect.top - 2,
                width: rect.width + 4,
                height: rect.height + 4,
                opacity: 1,
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              rx={14}
              fill="none"
              stroke="#2A398D"
              strokeWidth={2}
              className="animate-pulse"
            />
          </svg>

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            key={step}
            initial={{ opacity: 0, y: current.position === 'below' ? -8 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="fixed z-[101] w-[calc(100%-2rem)] max-w-xs"
            style={{
              pointerEvents: 'auto',
              top: current.position === 'below' ? tooltipY : undefined,
              bottom: current.position === 'above' ? `calc(100vh - ${tooltipY}px)` : undefined,
              left: Math.min(
                Math.max(16, rect.left),
                typeof window !== 'undefined' ? window.innerWidth - 320 : 400
              ),
            }}
          >
            <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-4">
              {/* Step dots + close */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1.5">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        i === step
                          ? 'w-5 bg-[#2A398D]'
                          : i < step
                          ? 'w-2 bg-[#2A398D]/40'
                          : 'w-2 bg-gray-200 dark:bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss() }}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <h3 className="font-display text-base text-gray-900 dark:text-white mb-1">
                {current.title}
              </h3>
              <p className="text-sm font-body text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                {current.description}
              </p>

              <div className="flex items-center justify-between">
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss() }}
                  className="text-xs font-body text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  Omitir
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next() }}
                  className="px-4 py-1.5 rounded-xl bg-[#2A398D] text-white text-sm font-body font-semibold hover:bg-[#1e2b6e] transition-colors"
                >
                  {step < STEPS.length - 1 ? 'Siguiente' : '¡Listo!'}
                </button>
              </div>
            </div>

            {/* Arrow */}
            <div
              className={`absolute left-8 w-3 h-3 bg-white dark:bg-[#1a1a2e] border-gray-200 dark:border-white/10 rotate-45 ${
                current.position === 'below'
                  ? '-top-1.5 border-l border-t'
                  : '-bottom-1.5 border-r border-b'
              }`}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
