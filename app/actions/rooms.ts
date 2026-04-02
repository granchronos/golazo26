'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateRoomCode, generateInviteSlug } from '@/lib/utils/rooms'

export async function createRoom(_prevState: unknown, formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  if (!name || name.length < 3) {
    return { error: 'El nombre debe tener al menos 3 caracteres' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const admin = await createAdminClient()

  // Check max 2 created rooms (also enforced by DB trigger)
  const { count } = await admin.from('rooms').select('id', { count: 'exact', head: true }).eq('admin_id', user.id)
  if ((count ?? 0) >= 2) return { error: 'Solo puedes crear un máximo de 2 salas' }

  const code = generateRoomCode()
  const invite_slug = generateInviteSlug()

  const { data: room, error } = await admin
    .from('rooms')
    .insert({ name, description, code, invite_slug, admin_id: user.id })
    .select()
    .single()

  if (error) {
    console.error('[createRoom] DB error:', error.message, error.details, error.code)
    if (error.message.includes('máximo')) return { error: error.message }
    return { error: `Error creando sala: ${error.message}` }
  }

  // Auto-join as admin
  await admin.from('room_members').insert({ room_id: room.id, user_id: user.id })

  revalidatePath('/')
  redirect(`/groups/${room.id}`)
}

export async function joinRoom(_prevState: unknown, formData: FormData) {
  const code = (formData.get('code') as string)?.toUpperCase().trim()

  if (!code || code.length !== 6) {
    return { error: 'Código inválido (6 caracteres)' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const admin = await createAdminClient()

  const { data: room } = await admin
    .from('rooms')
    .select('id')
    .eq('code', code)
    .single()

  if (!room) return { error: 'Sala no encontrada' }

  const { data: existing } = await admin
    .from('room_members')
    .select('id')
    .eq('room_id', room.id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    redirect(`/groups/${room.id}`)
  }

  const { error } = await admin
    .from('room_members')
    .insert({ room_id: room.id, user_id: user.id })

  if (error) {
    if (error.message.includes('máximo') || error.message.includes('llena')) return { error: error.message }
    return { error: 'No se pudo unir a la sala' }
  }

  revalidatePath('/')
  redirect(`/groups/${room.id}`)
}

export async function joinRoomBySlug(slug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const admin = await createAdminClient()

  const { data: room } = await admin
    .from('rooms')
    .select('id')
    .eq('invite_slug', slug)
    .single()

  if (!room) return { error: 'Sala no encontrada' }

  const { data: existing } = await admin
    .from('room_members')
    .select('id')
    .eq('room_id', room.id)
    .eq('user_id', user.id)
    .single()

  if (existing) return { roomId: room.id }

  const { error } = await admin
    .from('room_members')
    .insert({ room_id: room.id, user_id: user.id })

  if (error) {
    if (error.message.includes('máximo') || error.message.includes('llena')) return { error: error.message }
    return { error: 'No se pudo unir a la sala' }
  }

  return { roomId: room.id }
}
