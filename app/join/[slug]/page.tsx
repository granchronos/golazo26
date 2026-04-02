import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { joinRoomBySlug } from '@/app/actions/rooms'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function JoinBySlugPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/register?next=/join/${encodeURIComponent(slug)}`)
  }

  const result = await joinRoomBySlug(slug)

  if (result.error) {
    redirect(`/groups?error=${encodeURIComponent(result.error)}`)
  }

  redirect(`/groups/${result.roomId}`)
}
