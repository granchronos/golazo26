'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const TOUR_KEY = 'golazo26_predictions_tour_v3'

interface TourStep {
  target: string
  title: string
  description: string
  fallbackPosition?: { top: string; left: string }
}

const STEPS: TourStep[] = [
  {
    target: '#tour-progress',
    title: '📊 Tu progreso',
    description: 'Aquí ves cuántos grupos llevas y el tiempo que falta para el cierre.',
  },
  {
    target: '#group-A',
    title: '🏴 Elige 1° y 2° lugar',
    description: 'Toca un equipo para elegirlo como 1° (dorado). Toca otro para el 2° (azul). Luego presiona "Guardar grupo".',
  },
  {
    target: '#tour-save-all',
    title: '💾 Guarda todo de una vez',
    description: 'Cuando llenes varios grupos sin guardar, aparece este botón flotante para guardarlos todos juntos.',
    fallbackPosition: { top: '70vh', left: '50%' },
  },
  {
    target: '#knockout-section',
    title: '⚔️ Fase eliminatoria',
    description: 'Después de los grupos, desplázate hasta aquí. Se abren las rondas desde 32avos hasta la Final.',
  },
  {
    target: '#knockout-round-0',
    title: '🏟️ Ronda de 32',
    description: 'Elige el ganador de cada partido. Los equipos se llenan automáticamente según lo que elegiste en los grupos.',
  },
  {
    target: '#knockout-round-4',
    title: '🏆 Camino al Campeón',
    description: 'Sigue eligiendo ganadores ronda tras ronda: Octavos → Cuartos → Semis → ¡Final! Tu campeón se mostrará al terminar.',
    fallbackPosition: { top: '40vh', left: '50%' },
  },
]

export function PredictionsTour() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) {
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    localStorage.setItem(TOUR_KEY, '1')
  }, [])

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      dismiss()
    }
  }, [step, dismiss])

  const prev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1)
  }, [step])

  // Scroll target into view when step changes
  useEffect(() => {
    if (!visible) return
    const current = STEPS[step]
    const el = document.querySelector(current.target)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [step, visible])

  if (!visible) return null

  const current = STEPS[step]

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px]"
          />

          {/* Center card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[101] left-4 right-4 sm:left-auto sm:right-auto sm:w-[380px] sm:left-1/2 sm:-translate-x-1/2 bottom-20 sm:bottom-12"
          >
            <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
              {/* Progress bar */}
              <div className="h-1 bg-gray-100 dark:bg-white/[0.06]">
                <div
                  className="h-full bg-[#2A398D] transition-all duration-300"
                  style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                />
              </div>

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-display text-lg text-gray-900 dark:text-white">
                    {current.title}
                  </h3>
                  <button
                    onClick={dismiss}
                    className="p-1 -mt-0.5 -mr-1 rounded-lg text-gray-300 hover:text-gray-500 dark:hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Step indicator */}
                <p className="text-[10px] font-mono text-gray-400 mb-3">
                  {step + 1} de {STEPS.length}
                </p>

                <p className="text-sm font-body text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
                  {current.description}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={dismiss}
                    className="text-xs font-body text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    Omitir tour
                  </button>

                  <div className="flex items-center gap-2">
                    {step > 0 && (
                      <button
                        onClick={prev}
                        className="px-3 py-1.5 rounded-xl text-xs font-body font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                      >
                        Atrás
                      </button>
                    )}
                    <button
                      onClick={next}
                      className={cn(
                        'flex items-center gap-1 px-4 py-1.5 rounded-xl text-sm font-body font-semibold transition-colors',
                        step === STEPS.length - 1
                          ? 'bg-[#3CAC3B] text-white hover:bg-[#2e9a2e]'
                          : 'bg-[#2A398D] text-white hover:bg-[#1e2b6e]'
                      )}
                    >
                      {step < STEPS.length - 1 ? (
                        <>Siguiente <ChevronRight size={14} /></>
                      ) : (
                        '¡Empezar!'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
