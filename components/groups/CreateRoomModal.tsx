'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { createRoom } from '@/app/actions/rooms'

function SubmitBtn() {
  const { pending } = useFormStatus()
  return <Button type="submit" loading={pending} className="w-full">Crear sala</Button>
}

export function CreateRoomModal() {
  const [open, setOpen] = useState(false)
  const [state, formAction] = useFormState(createRoom, null)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-fwc w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-base"
      >
        <Plus size={20} />
        Crear nueva sala
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Crear sala">
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <p className="text-sm text-red-500 font-body">{state.error}</p>
          )}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body text-gray-700 dark:text-gray-300">
              Nombre de la sala
            </label>
            <input
              name="name"
              type="text"
              placeholder="Ej: Los Cracks del Mundial"
              required
              minLength={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#2A398D] dark:text-white placeholder:text-gray-400 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium font-body text-gray-700 dark:text-gray-300">
              Descripción <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              name="description"
              placeholder="Una descripción de tu sala..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#2A398D] dark:text-white placeholder:text-gray-400 transition-all resize-none"
            />
          </div>
          <SubmitBtn />
        </form>
      </Modal>
    </>
  )
}
