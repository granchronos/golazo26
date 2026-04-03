'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { register } from '@/app/actions/auth'
import { loginWithGoogle } from '@/app/actions/auth'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 rounded-xl bg-[#2A398D] text-white text-sm font-body font-semibold hover:bg-[#1e2b6e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'Creando cuenta...' : 'Crear cuenta'}
    </button>
  )
}

function GoogleButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm font-body font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? (
        <div className="w-[18px] h-[18px] border-2 border-gray-300 border-t-[#4285F4] rounded-full animate-spin" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      )}
      {pending ? 'Conectando...' : 'Registrarse con Google'}
    </button>
  )
}

export default function RegisterPage() {
  const [state, formAction] = useFormState(register, null)
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || ''

  return (
    <div className="min-h-screen flex bg-[#FAFAFA] dark:bg-[#0a0a0f]">
      {/* Left panel — branding (desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#2A398D] relative overflow-hidden items-end p-12">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2A398D] to-[#1a2460]" />
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-6">
            <span className="font-display text-white text-2xl">26</span>
          </div>
          <h1 className="font-display text-5xl text-white leading-tight mb-3">
            Predice.<br />Compite.<br />Gana.
          </h1>
          <p className="font-body text-white/60 text-sm max-w-xs">
            48 equipos, 12 grupos, 1 predictor. Únete gratis y demuestra que sabes de fútbol.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-lg bg-[#2A398D] flex items-center justify-center">
              <span className="font-display text-white text-sm">26</span>
            </div>
            <span className="font-display text-lg text-gray-900 dark:text-white">Golazo</span>
          </div>

          <h2 className="font-display text-2xl text-gray-900 dark:text-white mb-1">Crear cuenta</h2>
          <p className="text-sm font-body text-gray-400 mb-8">Regístrate gratis en segundos</p>

          {/* Error */}
          {state?.error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-body">
              {state.error}
            </div>
          )}

          {/* Google button */}
          <form action={loginWithGoogle} className="mb-4">
            {next && <input type="hidden" name="next" value={next} />}
            <GoogleButton />
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#FAFAFA] dark:bg-[#0a0a0f] px-3 text-xs font-body text-gray-400">o con correo</span>
            </div>
          </div>

          {/* Email form */}
          <form action={formAction} className="space-y-4">
            {next && <input type="hidden" name="next" value={next} />}
            <div>
              <label className="block text-sm font-body font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nombre
              </label>
              <input
                name="name"
                type="text"
                placeholder="¿Cómo te llamamos?"
                required
                minLength={2}
                autoComplete="name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2A398D]/40 focus:border-[#2A398D] text-sm font-body transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-body font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Correo electrónico
              </label>
              <input
                name="email"
                type="email"
                placeholder="tu@email.com"
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2A398D]/40 focus:border-[#2A398D] text-sm font-body transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-body font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Contraseña
              </label>
              <input
                name="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2A398D]/40 focus:border-[#2A398D] text-sm font-body transition-all"
              />
            </div>

            <SubmitButton />
          </form>

          <p className="text-center text-sm font-body text-gray-400 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-[#2A398D] dark:text-blue-400 hover:underline font-medium">
              Iniciar sesión
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
