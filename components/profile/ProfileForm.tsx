'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, Trash2, AlertTriangle, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { updateProfile, changePassword, deleteAccount } from '@/app/actions/profile'
import type { Profile } from '@/types/database'

function SubmitButton({ children, variant = 'primary' }: { children: React.ReactNode; variant?: 'primary' | 'danger' }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-body font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary'
          ? 'bg-[#2A398D] text-white hover:bg-[#1e2b6e]'
          : 'bg-red-600 text-white hover:bg-red-700'
      )}
    >
      {pending && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
}

interface ProfileFormProps {
  profile: Profile
  email: string
  isOAuth: boolean
}

export function ProfileForm({ profile, email, isOAuth }: ProfileFormProps) {
  const [profileState, profileAction] = useFormState(updateProfile, null)
  const [passwordState, passwordAction] = useFormState(changePassword, null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    const result = await deleteAccount()
    if (result?.error) {
      setDeleteError(result.error)
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 sm:px-5 py-3 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2">
          <User size={16} className="text-[#2A398D]" />
          <span className="text-xs font-display uppercase tracking-wider text-gray-500 dark:text-gray-400">Información personal</span>
        </div>
        <form action={profileAction} className="p-4 sm:p-5 space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-body font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={profile.name}
              required
              minLength={2}
              maxLength={50}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm font-body dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2A398D]/30 focus:border-[#2A398D] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-body font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Email
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] text-sm font-body text-gray-500 dark:text-gray-400">
              {email}
              {isOAuth && (
                <span className="text-[10px] font-mono bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full">Google</span>
              )}
            </div>
          </div>

          {profileState?.error && (
            <p className="text-sm font-body text-red-500">{profileState.error}</p>
          )}
          {profileState?.success && (
            <p className="flex items-center gap-1.5 text-sm font-body text-[#3CAC3B]">
              <Check size={14} /> {profileState.success}
            </p>
          )}

          <div className="flex justify-end">
            <SubmitButton>Guardar cambios</SubmitButton>
          </div>
        </form>
      </div>

      {/* Change password — only for email/password users */}
      {!isOAuth && (
        <div className="glass-card overflow-hidden">
          <div className="px-4 sm:px-5 py-3 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2">
            <Lock size={16} className="text-[#C9A84C]" />
            <span className="text-xs font-display uppercase tracking-wider text-gray-500 dark:text-gray-400">Cambiar contraseña</span>
          </div>
          <form action={passwordAction} className="p-4 sm:p-5 space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-xs font-body font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Nueva contraseña
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={6}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm font-body dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] transition-colors"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-body font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm font-body dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 focus:border-[#C9A84C] transition-colors"
                placeholder="Repite la contraseña"
              />
            </div>

            {passwordState?.error && (
              <p className="text-sm font-body text-red-500">{passwordState.error}</p>
            )}
            {passwordState?.success && (
              <p className="flex items-center gap-1.5 text-sm font-body text-[#3CAC3B]">
                <Check size={14} /> {passwordState.success}
              </p>
            )}

            <div className="flex justify-end">
              <SubmitButton>Cambiar contraseña</SubmitButton>
            </div>
          </form>
        </div>
      )}

      {/* Danger zone */}
      <div className="glass-card overflow-hidden border-red-200 dark:border-red-500/20">
        <div className="px-4 sm:px-5 py-3 bg-red-50 dark:bg-red-500/[0.06] border-b border-red-100 dark:border-red-500/10 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500" />
          <span className="text-xs font-display uppercase tracking-wider text-red-500">Zona peligrosa</span>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-sm font-body text-gray-500 dark:text-gray-400 mb-4">
            Al eliminar tu cuenta se borrarán todas tus predicciones y puntuaciones.
            Si eres admin de una sala con otros miembros, el rol se transferirá automáticamente.
            Las salas donde seas el único miembro serán eliminadas.
          </p>

          <AnimatePresence>
            {!showDelete ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-500/20 text-sm font-body font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={14} />
                Eliminar mi cuenta
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <p className="text-sm font-body font-semibold text-red-600 dark:text-red-400">
                  ¿Estás seguro? Esta acción no se puede deshacer.
                </p>
                {deleteError && (
                  <p className="text-sm font-body text-red-500">{deleteError}</p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-body font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    {deleting ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}
                  </button>
                  <button
                    onClick={() => setShowDelete(false)}
                    disabled={deleting}
                    className="px-4 py-2.5 rounded-xl text-sm font-body text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
