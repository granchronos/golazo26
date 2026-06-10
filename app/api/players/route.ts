import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() || ''

  try {
    const admin = await createAdminClient()

    let query = admin
      .from('players')
      .select(`
        id,
        name,
        position,
        team_id,
        teams:teams (
          name,
          flag_emoji
        )
      `)

    if (q.length >= 2) {
      query = query.ilike('name', `%${q}%`).limit(20)
    } else {
      // Default: return star players (cached/favorites list)
      query = query.eq('is_star', true).order('name', { ascending: true })
    }

    const { data, error } = await query

    if (error) {
      console.error('[api/players] Database error:', error)
      return NextResponse.json({ players: [], error: error.message }, { status: 500 })
    }

    const players = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      teamId: p.team_id,
      teamName: p.teams?.name || '',
      flagEmoji: p.teams?.flag_emoji || '⚽'
    }))

    return NextResponse.json({ players })
  } catch (error: any) {
    console.error('[api/players] Internal error:', error)
    return NextResponse.json({ players: [], error: 'Internal Server Error' }, { status: 500 })
  }
}
