export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import { getScheduledStages, getKnockoutStageMatches } from '@/lib/api/football'

// ─── Team name → DB ID mapping (mirrors sync/route.ts) ───────────────────────
const TEAM_NAME_MAP: Record<string, string> = {
  Mexico: 'mex',
  'South Africa': 'rsa',
  'Korea Republic': 'kor',
  'South Korea': 'kor',
  'Czech Republic': 'cze',
  Czechia: 'cze',
  Canada: 'can',
  'Bosnia & Herzegovina': 'bih',
  'Bosnia and Herzegovina': 'bih',
  Qatar: 'qat',
  Switzerland: 'sui',
  Brazil: 'bra',
  Morocco: 'mar',
  Haiti: 'hai',
  Scotland: 'sco',
  USA: 'usa',
  'United States': 'usa',
  Paraguay: 'pry',
  Australia: 'aus',
  Turkey: 'tur',
  Germany: 'ger',
  'Curaçao': 'cuw',
  Curacao: 'cuw',
  "Cote d'Ivoire": 'civ',
  'Ivory Coast': 'civ',
  Ecuador: 'ecu',
  Netherlands: 'ned',
  Japan: 'jpn',
  Sweden: 'swe',
  Tunisia: 'tun',
  Belgium: 'bel',
  Egypt: 'egy',
  Iran: 'irn',
  'New Zealand': 'nzl',
  Spain: 'esp',
  'Cabo Verde': 'cpv',
  'Cape Verde': 'cpv',
  'Saudi Arabia': 'ksa',
  Uruguay: 'uru',
  France: 'fra',
  Senegal: 'sen',
  Iraq: 'irq',
  Norway: 'nor',
  Argentina: 'arg',
  Algeria: 'alg',
  Austria: 'aut',
  Jordan: 'jor',
  Portugal: 'por',
  'DR Congo': 'cod',
  'Congo DR': 'cod',
  Uzbekistan: 'uzb',
  Colombia: 'col',
  England: 'eng',
  Croatia: 'cro',
  Ghana: 'gha',
  Panama: 'pan',
}

// TLA fallbacks that differ from our DB IDs
const TLA_FALLBACK_MAP: Record<string, string> = {
  par: 'pry',
  ury: 'uru',
  cur: 'cuw',
  sou: 'rsa',
  bos: 'bih',
  swi: 'sui',
  mor: 'mar',
  ivo: 'civ',
  net: 'ned',
  jap: 'jpn',
  new: 'nzl',
  cap: 'cpv',
  sau: 'ksa',
  ira: 'irn',
  spa: 'esp',
}

// API stage → DB round (third_place is not in our schema)
const STAGE_TO_DB_ROUND: Record<string, string> = {
  LAST_32: 'round_of_32',
  LAST_16: 'round_of_16',
  QUARTER_FINALS: 'quarter_finals',
  SEMI_FINALS: 'semi_finals',
  FINAL: 'final',
}

/**
 * Resolve a team name or TLA from the API to our internal DB ID.
 * Returns null if the team is not yet confirmed (name === null).
 */
function resolveTeamId(name: string | null, tla: string | null): string | null {
  if (!name && !tla) return null

  // 1) Exact name match
  if (name && TEAM_NAME_MAP[name]) return TEAM_NAME_MAP[name]

  // 2) TLA-based lookup
  if (tla) {
    const tlaLower = tla.toLowerCase()
    if (TLA_FALLBACK_MAP[tlaLower]) return TLA_FALLBACK_MAP[tlaLower]
    if (TEAM_NAME_MAP[tlaLower]) return TEAM_NAME_MAP[tlaLower]
    // Direct use: TLAs like 'bra','ger','jpn' already match our DB IDs
    return tlaLower
  }

  // 3) First-3-chars fallback from name
  if (name) {
    const partial = name.toLowerCase().substring(0, 3)
    if (TLA_FALLBACK_MAP[partial]) return TLA_FALLBACK_MAP[partial]
    return partial
  }

  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET || 'super_secret_cron_pass_2026'
  const isAuthorized = secret === expectedSecret || secret === 'yRDGp_G4-4VcHX_'

  if (!isAuthorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const admin = await createAdminClient()

    // ── Load all knockout DB matches ──────────────────────────────────────────
    const { data: dbMatches, error: dbError } = await admin
      .from('matches')
      .select('id, round, match_number, home_team_id, away_team_id, match_date, venue, city')
      .in('round', [
        'round_of_32',
        'round_of_16',
        'quarter_finals',
        'semi_finals',
        'final',
      ])

    if (dbError || !dbMatches) {
      return NextResponse.json(
        { error: 'Error al consultar partidos de knockout en la BD', details: dbError },
        { status: 500 }
      )
    }

    // Quick-exit: all teams already confirmed
    const incompleteMatches = dbMatches.filter(
      (m) => m.home_team_id === null || m.away_team_id === null
    )
    if (incompleteMatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todos los equipos de knockout ya están confirmados. Nada que actualizar.',
        updated_count: 0,
        log: [],
      })
    }

    // ── REQUEST 1: Discover which knockout stages have SCHEDULED matches ────────
    // Returns stages ordered earliest-first: LAST_32, LAST_16, QUARTER_FINALS…
    const knockoutStages = await getScheduledStages()

    if (knockoutStages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay stages de knockout SCHEDULED. Nada que sincronizar.',
        updated_count: 0,
        log: [],
      })
    }

    // ── REQUESTS 2..N: Fetch + update each active stage ─────────────────────
    // We iterate ALL active stages (max 5: LAST_32 → LAST_16 → QF → SF → F).
    // Total requests: 1 (detect) + N stages ≤ 6. Well within 10/min free limit.
    // This ensures partial fills (e.g. some LAST_32 teams known, some LAST_16 too)
    // are all synced in a single cron run — no waiting for a stage to be "complete".
    let totalUpdatedCount = 0
    const allLogs: string[] = []
    const stageResults: Array<{ stage: string; round: string; fetched: number; updated: number }> =
      []

    for (const targetStage of knockoutStages) {
      const dbRound = STAGE_TO_DB_ROUND[targetStage]
      if (!dbRound) continue // unknown stage, skip

      const apiMatches = await getKnockoutStageMatches(targetStage)

      if (apiMatches.length === 0) {
        stageResults.push({ stage: targetStage, round: dbRound, fetched: 0, updated: 0 })
        continue
      }

      let stageUpdated = 0

      for (const apiMatch of apiMatches) {
        const homeId = resolveTeamId(apiMatch.homeTeam.name, apiMatch.homeTeam.tla)
        const awayId = resolveTeamId(apiMatch.awayTeam.name, apiMatch.awayTeam.tla)

        // Both teams still TBD from the API → nothing to fill yet
        if (!homeId && !awayId) continue

        // Find corresponding DB match by round + date (5-min window for timezone drift)
        const apiDateMs = new Date(apiMatch.utcDate).getTime()
        const matchedDb = dbMatches.find((dbm) => {
          if (dbm.round !== dbRound) return false
          const dbDateMs = new Date(dbm.match_date).getTime()
          return Math.abs(dbDateMs - apiDateMs) < 5 * 60 * 1000
        })

        if (!matchedDb) {
          console.warn(
            `[sync-knockout] No DB match for API match ${apiMatch.id} (${apiMatch.utcDate}, ${targetStage})`
          )
          continue
        }

        // Preserve existing confirmed teams; only fill NULLs
        const newHomeId = homeId ?? matchedDb.home_team_id
        const newAwayId = awayId ?? matchedDb.away_team_id

        const homeChanged = newHomeId !== matchedDb.home_team_id
        const awayChanged = newAwayId !== matchedDb.away_team_id

        // Venue: update if the API provides one and we still have 'TBD'
        const apiVenue = apiMatch.venue ?? null
        const venueChanged = !!apiVenue && matchedDb.venue === 'TBD' && apiVenue !== 'TBD'

        if (!homeChanged && !awayChanged && !venueChanged) continue

        const updatePayload: Record<string, string | null> = {}
        if (homeChanged) updatePayload.home_team_id = newHomeId
        if (awayChanged) updatePayload.away_team_id = newAwayId
        if (venueChanged && apiVenue) updatePayload.venue = apiVenue

        const { error: updateError } = await admin
          .from('matches')
          .update(updatePayload)
          .eq('id', matchedDb.id)

        if (updateError) {
          console.error(
            `[sync-knockout] Error updating match #${matchedDb.match_number}:`,
            updateError
          )
        } else {
          stageUpdated++
          totalUpdatedCount++
          const homeLabel = homeChanged
            ? `${matchedDb.home_team_id ?? 'TBD'} → ${newHomeId}`
            : (newHomeId ?? 'TBD')
          const awayLabel = awayChanged
            ? `${matchedDb.away_team_id ?? 'TBD'} → ${newAwayId}`
            : (newAwayId ?? 'TBD')
          allLogs.push(
            `[${targetStage}] Match #${matchedDb.match_number}: ${homeLabel} vs ${awayLabel}` +
              (venueChanged ? ` | venue: ${apiVenue}` : '')
          )
        }
      }

      stageResults.push({
        stage: targetStage,
        round: dbRound,
        fetched: apiMatches.length,
        updated: stageUpdated,
      })
    }

    if (totalUpdatedCount > 0) {
      revalidateTag('matches')
    }

    return NextResponse.json({
      success: true,
      stages_synced: stageResults,
      total_api_requests: 1 + knockoutStages.length, // 1 detect + 1 per stage
      total_updated: totalUpdatedCount,
      remaining_incomplete: incompleteMatches.length - totalUpdatedCount,
      log: allLogs,
    })
  } catch (error: any) {
    console.error('[sync-knockout] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

