'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(50, 'Nombre muy largo'),
})

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export async function updateProfile(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const parsed = updateProfileSchema.safeParse({
    name: formData.get('name'),
  })
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ name: parsed.data.name, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Error actualizando perfil' }
  }

  revalidatePath('/', 'layout')
  return { success: 'Nombre actualizado' }
}

export async function changePassword(_prevState: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const parsed = changePasswordSchema.safeParse({
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Contraseña actualizada' }
}

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const admin = await createAdminClient()

  // Find rooms where this user is the admin
  const { data: adminRooms } = await admin
    .from('rooms')
    .select('id')
    .eq('admin_id', user.id)

  if (adminRooms && adminRooms.length > 0) {
    for (const room of adminRooms) {
      // Count other members in this room
      const { count } = await admin
        .from('room_members')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id)
        .neq('user_id', user.id)

      if (count && count > 0) {
        // Transfer admin to the first other member
        const { data: nextAdmin } = await admin
          .from('room_members')
          .select('user_id')
          .eq('room_id', room.id)
          .neq('user_id', user.id)
          .order('joined_at', { ascending: true })
          .limit(1)
          .single()

        if (nextAdmin) {
          await admin
            .from('rooms')
            .update({ admin_id: nextAdmin.user_id })
            .eq('id', room.id)
        }
      }
      // If no other members, the room will be deleted by ON DELETE CASCADE
      // when the auth user is deleted (admin_id references auth.users)
    }
  }

  // Delete the auth user — cascades to profiles, room_members, predictions, scores
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    return { error: 'Error eliminando cuenta. Intenta de nuevo.' }
  }

  // Sign out and redirect
  await supabase.auth.signOut()
  redirect('/login')
}
