import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type { Match } from '@/types/database'

export const getCachedMatches = unstable_cache(
  async () => {
    const admin = await createAdminClient()
    const { data } = await admin.from('matches').select('*').order('match_number', { ascending: true })
    return (data || []) as Match[]
  },
  ['all-matches'],
  { revalidate: 30, tags: ['matches'] }
)

export const getCachedProfiles = unstable_cache(
  async (userIds: string[]) => {
    const admin = await createAdminClient()
    const { data } = await admin.from('profiles').select('id, user_id, name, avatar_url, created_at, updated_at').in('user_id', userIds)
    return data || []
  },
  ['profiles'],
  { revalidate: 300, tags: ['profiles'] }
)
