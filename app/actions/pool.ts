'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { PoolSplit } from '@/types/database'
import { GROUP_STAGE_DEADLINE } from '@/lib/constants/points'

async function verifyAdmin(roomId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' as const, user: null, admin: null }

  const adminClient = await createAdminClient()
  const { data: room } = await adminClient
    .from('rooms')
    .select('admin_id')
    .eq('id', roomId)
    .single()

  if (!room || room.admin_id !== user.id) {
    return { error: 'Solo el admin puede realizar esta acción' as const, user: null, admin: null }
  }

  return { error: null, user, admin: adminClient }
}

function validateSplit(split: PoolSplit[]): string | null {
  if (!Array.isArray(split) || split.length === 0 || split.length > 10) {
    return 'Distribución de premios inválida'
  }
  const total = split.reduce((sum, s) => sum + s.pct, 0)
  if (total !== 100) return 'Los porcentajes deben sumar 100%'
  for (const s of split) {
    if (!Number.isInteger(s.place) || s.place < 1) return 'Lugar inválido'
    if (!Number.isInteger(s.pct) || s.pct < 1) return 'Porcentaje inválido'
  }
  const places = split.map((s) => s.place)
  if (new Set(places).size !== places.length) return 'Lugares duplicados'
  return null
}

export async function togglePool(roomId: string, enabled: boolean) {
  const { error, user, admin } = await verifyAdmin(roomId)
  if (error) return { error }

  const { error: dbError } = await admin!
    .from('rooms')
    .update({ pool_enabled: enabled })
    .eq('id', roomId)

  if (dbError) return { error: 'Error actualizando la sala' }

  if (!enabled) {
    // Reset all payment statuses when disabling
    await admin!
      .from('room_members')
      .update({
        payment_status: 'pending' as const,
        payment_confirmed_at: null,
        payment_confirmed_by: null,
      })
      .eq('room_id', roomId)
  }

  revalidatePath(`/groups/${roomId}`)
  return { success: true }
}

export async function updatePoolConfig(
  roomId: string,
  buyIn: number,
  currency: string,
  split: PoolSplit[]
) {
  const { error, admin } = await verifyAdmin(roomId)
  if (error) return { error }

  if (new Date() > GROUP_STAGE_DEADLINE) {
    return { error: 'No se puede modificar la polla después del cierre de grupos' }
  }

  if (!Number.isInteger(buyIn) || buyIn < 0 || buyIn > 1000000) {
    return { error: 'Monto de entrada inválido' }
  }

  const validCurrencies = ['PEN', 'MXN', 'USD', 'EUR', 'COP', 'ARS', 'CLP', 'BRL']
  if (!validCurrencies.includes(currency)) {
    return { error: 'Moneda inválida' }
  }

  const splitError = validateSplit(split)
  if (splitError) return { error: splitError }

  const { error: dbError } = await admin!
    .from('rooms')
    .update({
      pool_buy_in: buyIn,
      pool_currency: currency,
      pool_split: JSON.parse(JSON.stringify(split)),
    })
    .eq('id', roomId)

  if (dbError) return { error: 'Error actualizando configuración' }

  revalidatePath(`/groups/${roomId}`)
  return { success: true }
}

export async function confirmPayment(roomId: string, memberId: string) {
  const { error, user, admin } = await verifyAdmin(roomId)
  if (error) return { error }

  // Verify the member belongs to this room
  const { data: member } = await admin!
    .from('room_members')
    .select('id, user_id')
    .eq('room_id', roomId)
    .eq('user_id', memberId)
    .single()

  if (!member) return { error: 'Miembro no encontrado' }

  const { error: dbError } = await admin!
    .from('room_members')
    .update({
      payment_status: 'confirmed' as const,
      payment_confirmed_at: new Date().toISOString(),
      payment_confirmed_by: user!.id,
    })
    .eq('room_id', roomId)
    .eq('user_id', memberId)

  if (dbError) return { error: 'Error confirmando pago' }

  revalidatePath(`/groups/${roomId}`)
  return { success: true }
}

export async function revokePayment(roomId: string, memberId: string) {
  const { error, admin } = await verifyAdmin(roomId)
  if (error) return { error }

  const { error: dbError } = await admin!
    .from('room_members')
    .update({
      payment_status: 'pending' as const,
      payment_confirmed_at: null,
      payment_confirmed_by: null,
    })
    .eq('room_id', roomId)
    .eq('user_id', memberId)

  if (dbError) return { error: 'Error revocando pago' }

  revalidatePath(`/groups/${roomId}`)
  return { success: true }
}
