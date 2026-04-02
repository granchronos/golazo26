import { NextResponse } from 'next/server'
import { getLiveWorldCupFixtures, getWorldCupFixturesByDate, getWorldCupFixtures } from '@/lib/api/football'

/**
 * GET /api/live-scores
 *
 * Query params:
 *   ?live=true           → only in-play matches
 *   ?date=YYYY-MM-DD     → matches on a specific date
 *   (no params)          → all World Cup 2026 fixtures
 *
 * Cached for 60 seconds via Next.js fetch revalidation.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const live = searchParams.get('live')
  const date = searchParams.get('date')

  try {
    let data
    if (live === 'true') {
      data = await getLiveWorldCupFixtures()
    } else if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      data = await getWorldCupFixturesByDate(date)
    } else {
      data = await getWorldCupFixtures()
    }

    return NextResponse.json({ matches: data }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    })
  } catch (error) {
    console.error('[live-scores]', error)
    return NextResponse.json({ matches: [], error: 'Failed to fetch live scores' }, { status: 500 })
  }
}
