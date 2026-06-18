import { NextResponse } from 'next/server'
import { getWorldCupScorers } from '@/lib/api/football'
import { createAdminClient } from '@/lib/supabase/server'

// Force dynamic rendering since we are performing dynamic API fetches and database queries
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Fetch live scorers from football-data.org API
    const scorers = await getWorldCupScorers()

    // 2. Fetch players from the database
    const admin = await createAdminClient()
    const { data: dbPlayers, error } = await admin
      .from('players')
      .select('id, name, position, team_id')

    if (error) {
      console.error('[api/live-scores/scorers] Database error:', error)
    }

    const playersMapped = (dbPlayers || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      teamId: p.team_id,
    }))

    return NextResponse.json(
      {
        scorers: scorers || [],
        players: playersMapped,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    )
  } catch (error: any) {
    console.error('[api/live-scores/scorers] Error:', error)
    return NextResponse.json(
      { scorers: [], players: [], error: 'Failed to fetch scorers' },
      { status: 500 }
    )
  }
}
