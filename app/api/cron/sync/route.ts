import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getWorldCupFixtures, mapApiStatus, getMatchEvents } from '@/lib/api/football'
import { recalculateAllScores } from '@/app/actions/predictions'

// Comprehensive English to DB ID team name mapping
const TEAM_NAME_MAP: Record<string, string> = {
  'Mexico': 'mex',
  'South Africa': 'rsa',
  'Korea Republic': 'kor',
  'South Korea': 'kor',
  'Czech Republic': 'cze',
  'Czechia': 'cze',
  'Canada': 'can',
  'Bosnia & Herzegovina': 'bih',
  'Bosnia and Herzegovina': 'bih',
  'Qatar': 'qat',
  'Switzerland': 'sui',
  'Brazil': 'bra',
  'Morocco': 'mar',
  'Haiti': 'hai',
  'Scotland': 'sco',
  'USA': 'usa',
  'United States': 'usa',
  'Paraguay': 'pry',
  'Australia': 'aus',
  'Turkey': 'tur',
  'Germany': 'ger',
  'Curaçao': 'cuw',
  'Curacao': 'cuw',
  'Cote d\'Ivoire': 'civ',
  'Ivory Coast': 'civ',
  'Ecuador': 'ecu',
  'Netherlands': 'ned',
  'Japan': 'jpn',
  'Sweden': 'swe',
  'Tunisia': 'tun',
  'Belgium': 'bel',
  'Egypt': 'egy',
  'Iran': 'irn',
  'New Zealand': 'nzl',
  'Spain': 'esp',
  'Cabo Verde': 'cpv',
  'Cape Verde': 'cpv',
  'Saudi Arabia': 'ksa',
  'Uruguay': 'uru',
  'France': 'fra',
  'Senegal': 'sen',
  'Iraq': 'irq',
  'Norway': 'nor',
  'Argentina': 'arg',
  'Algeria': 'alg',
  'Austria': 'aut',
  'Jordan': 'jor',
  'Portugal': 'por',
  'DR Congo': 'cod',
  'Congo DR': 'cod',
  'Uzbekistan': 'uzb',
  'Colombia': 'col',
  'England': 'eng',
  'Croatia': 'cro',
  'Ghana': 'gha',
  'Panama': 'pan',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET || 'super_secret_cron_pass_2026'

  if (secret !== expectedSecret) {
    console.error(`Sync unauthorized. Received: "${secret}", Expected: "${expectedSecret}"`)
    return NextResponse.json({ 
      error: 'No autorizado', 
      received: secret || 'empty', 
      expected: expectedSecret 
    }, { status: 401 })
  }

  try {
    const apiMatches = await getWorldCupFixtures()
    if (apiMatches.length === 0) {
      return NextResponse.json({ message: 'No se recibieron datos de la API de fútbol' })
    }

    const admin = await createAdminClient()

    // Fetch all current matches from DB
    const { data: dbMatches, error: dbError } = await admin
      .from('matches')
      .select('id, match_number, home_team_id, away_team_id, status, home_score, away_score, events')

    if (dbError || !dbMatches) {
      return NextResponse.json({ error: 'Error al consultar partidos en la BD', details: dbError }, { status: 500 })
    }

    let updatedCount = 0
    const updatedMatchesLog: string[] = []

    for (const apiMatch of apiMatches) {
      const apiStatus = mapApiStatus(apiMatch.statusShort)
      
      // We only update if the match is finished (or live, if we want real-time scores)
      // Let's support both live and finished matches!
      if (apiStatus === 'scheduled') continue

      // Map home/away team names from API to our DB IDs
      const homeDbId = TEAM_NAME_MAP[apiMatch.homeTeam] || apiMatch.homeTeam.toLowerCase().substring(0, 3)
      const awayDbId = TEAM_NAME_MAP[apiMatch.awayTeam] || apiMatch.awayTeam.toLowerCase().substring(0, 3)

      // Find the match in our DB by team IDs
      const matchedDb = dbMatches.find(dbm => 
        (dbm.home_team_id === homeDbId && dbm.away_team_id === awayDbId) ||
        // Sometimes APIs swap home/away, check that too just in case
        (dbm.home_team_id === awayDbId && dbm.away_team_id === homeDbId)
      )

      if (matchedDb) {
        const homeScore = apiMatch.homeGoals ?? 0
        const awayScore = apiMatch.awayGoals ?? 0
        
        // Let's determine the winner ID
        let winnerId: string | null = null
        if (apiStatus === 'finished') {
          if (homeScore > awayScore) {
            winnerId = matchedDb.home_team_id === homeDbId ? homeDbId : awayDbId
          } else if (awayScore > homeScore) {
            winnerId = matchedDb.away_team_id === awayDbId ? awayDbId : homeDbId
          }
        }

        // Fetch events if the match is live, OR if it is finished and has no events in DB yet
        const hasDbEvents = matchedDb.events && Array.isArray(matchedDb.events) && matchedDb.events.length > 0
        let eventsPayload = matchedDb.events
        let fetchedEvents = false

        if (apiStatus === 'live' || (apiStatus === 'finished' && !hasDbEvents)) {
          if (apiMatch.apiFixtureId) {
            try {
              const apiEvents = await getMatchEvents(apiMatch.apiFixtureId)
              if (apiEvents && apiEvents.length > 0) {
                eventsPayload = apiEvents
                  .filter(ev => ev.type === 'Goal' || ev.type === 'Card')
                  .map(ev => ({
                    time: ev.time.elapsed,
                    extra: ev.time.extra,
                    team_id: ev.team.name === apiMatch.homeTeam ? homeDbId : awayDbId,
                    player: ev.player.name,
                    type: ev.type,
                    detail: ev.detail,
                    comments: ev.comments
                  }))
                fetchedEvents = true
              }
            } catch (eventErr) {
              console.error(`Error fetching events for apiFixtureId ${apiMatch.apiFixtureId}:`, eventErr)
            }
          }
        }

        // Only update if there is a change in status, scores, or if new events were fetched
        const hasChanges = 
          matchedDb.status !== apiStatus ||
          matchedDb.home_score !== homeScore ||
          matchedDb.away_score !== awayScore ||
          fetchedEvents

        if (hasChanges) {
          const { error: updateError } = await admin
            .from('matches')
            .update({
              home_score: homeScore,
              away_score: awayScore,
              status: apiStatus,
              winner_id: winnerId,
              events: eventsPayload
            })
            .eq('id', matchedDb.id)

          if (updateError) {
            console.error(`Error updating match #${matchedDb.match_number}:`, updateError)
          } else {
            updatedCount++
            updatedMatchesLog.push(`Match #${matchedDb.match_number} (${homeDbId} vs ${awayDbId}) updated to ${homeScore}-${awayScore} [${apiStatus}] (events: ${fetchedEvents ? 'updated' : 'unchanged'})`)
          }
        }
      }
    }

    // Trigger recalculation if any matches were updated
    if (updatedCount > 0) {
      await recalculateAllScores()
    }

    return NextResponse.json({
      success: true,
      updated_count: updatedCount,
      log: updatedMatchesLog,
    })

  } catch (error: any) {
    console.error('Error during cron score sync:', error)
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}
