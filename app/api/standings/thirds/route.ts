export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getBestThirdPlacedTeams } from '@/lib/api/football'



export async function GET() {
  try {
    // Deadline to stop updating: End of June 29, 2026.
    const dateLimit = new Date('2026-06-30T00:00:00Z') // End of June 29 in UTC
    const now = new Date()

    const thirdPlacedTeams = await getBestThirdPlacedTeams()

    return NextResponse.json({
      success: true,
      isLive: now < dateLimit,
      data: thirdPlacedTeams,
    })
  } catch (error: any) {
    console.error('[standings/thirds] Error fetching third-placed teams:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
