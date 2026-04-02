import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Sidebar, MobileNav } from '@/components/ui/Navigation'
import { DashboardShell } from '@/components/ui/DashboardShell'
import type { Profile } from '@/types/database'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Use admin client for DB reads — avoids RLS infinite recursion on room_members policies
  const admin = await createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    const fallbackName = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario'
    const { data: newProfile } = await admin
      .from('profiles')
      .upsert({
        user_id: user.id,
        name: fallbackName,
        avatar_url: user.user_metadata?.avatar_url || null,
      }, { onConflict: 'user_id' })
      .select()
      .single()

    const safeProfile = newProfile || { user_id: user.id, name: fallbackName, avatar_url: null } as Profile

    return (
      <div className="min-h-screen">
        <Sidebar profile={safeProfile as Profile} />
        <DashboardShell>
          {children}
        </DashboardShell>
        <MobileNav profile={safeProfile as Profile} />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Sidebar profile={profile as Profile} />
      <DashboardShell>
        {children}
      </DashboardShell>
      <MobileNav profile={profile as Profile} />
    </div>
  )
}
