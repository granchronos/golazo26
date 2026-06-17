import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/matches
 *
 * Returns all matches from the DB with their current status and scores.
 * Used by the fixture page to show live/finished results and compute group standings.
 */
export async function GET() {
  try {
    const admin = await createAdminClient()

    const { data: matches, error } = await admin
      .from('matches')
      .select(
        'match_number, home_team_id, away_team_id, home_score, away_score, status, match_date, winner_id, events, odds'
      )
      .order('match_number', { ascending: true })

    if (error) {
      return NextResponse.json({ matches: [], error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { matches: matches || [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15',
        },
      }
    )
  } catch (error: any) {
    console.error('[api/matches]', error)
    return NextResponse.json({ matches: [], error: 'Error interno' }, { status: 500 })
  }
}
