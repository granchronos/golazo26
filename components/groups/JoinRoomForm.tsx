'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { joinRoom } from '@/app/actions/rooms'

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending} size="sm" className="flex-shrink-0">
      <LogIn size={16} />
      Entrar
    </Button>
  )
}

export function JoinRoomForm({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  const [state, formAction] = useFormState(joinRoom, null)

  if (variant === 'compact') {
    return (
      <form action={formAction} className="flex items-center gap-1.5">
        <input
          name="code"
          type="text"
          placeholder="CÓDIGO"
          maxLength={6}
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-mono uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#2A398D] dark:text-white placeholder:text-gray-400 placeholder:normal-case transition-all tracking-wider min-w-0"
        />
        <button type="submit" className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-body font-medium text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0">
          <LogIn size={14} />
          Unirse
        </button>
      </form>
    )
  }

  return (
    <form action={formAction} className="glass-card p-4 flex flex-col justify-between gap-3">
      <div>
        <p className="font-body font-semibold text-sm dark:text-white mb-1">Unirse a sala</p>
        <p className="text-xs text-gray-400 font-body">Introduce el código de 6 caracteres</p>
      </div>
      {state?.error && (
        <p className="text-xs text-red-500 font-body">{state.error}</p>
      )}
      <div className="flex gap-2">
        <input
          name="code"
          type="text"
          placeholder="ABC123"
          maxLength={6}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-mono uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#2A398D] dark:text-white placeholder:text-gray-400 placeholder:font-body placeholder:normal-case transition-all tracking-widest"
        />
        <SubmitBtn />
      </div>
    </form>
  )
}
