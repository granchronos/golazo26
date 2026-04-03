import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PageTransition } from '@/components/animations/PageTransition'
import { ProfileForm } from '@/components/profile/ProfileForm'
import type { Profile } from '@/types/database'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = await createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/')

  // Check if user signed in via OAuth (no password set)
  const isOAuth = user.app_metadata?.provider === 'google'

  return (
    <PageTransition>
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1 text-xs font-body text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-3">
          <ArrowLeft size={12} /> Inicio
        </Link>
        <h1 className="font-display text-2xl sm:text-3xl dark:text-white">Mi Perfil</h1>
        <p className="text-sm font-body text-gray-400 mt-1">Administra tu cuenta y preferencias</p>
      </div>

      <ProfileForm
        profile={profile as Profile}
        email={user.email ?? ''}
        isOAuth={isOAuth}
      />
    </PageTransition>
  )
}
