'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getWorldCupFixtures, mapApiStatus, type LiveMatch } from '@/lib/api/football'
import { TEAMS } from '@/lib/constants/teams'

const TEAM_NAME_TO_ID: Record<string, string> = Object.fromEntries(
  TEAMS.map((t) => [t.name.toLowerCase(), t.id])
)

function findTeamId(apiName: string): string | null {
  const lower = apiName.toLowerCase()
  if (TEAM_NAME_TO_ID[lower]) return TEAM_NAME_TO_ID[lower]
  for (const [name, id] of Object.entries(TEAM_NAME_TO_ID)) {
    if (lower.includes(name) || name.includes(lower)) return id
  }
  return null
}

/**
 * Sync live scores from API-Football into our matches table.
 * Only admins should call this (or a cron job).
 * Updates match status, scores, and winner_id based on API data.
 */
export async function syncLiveScores(roomId?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const admin = await createAdminClient()

  if (roomId) {
    const { data: room } = await admin.from('rooms').select('admin_id').eq('id', roomId).single()
    if (!room || room.admin_id !== user.id) {
      return { error: 'Solo el administrador puede sincronizar resultados' }
    }
  }

  const apiMatches = await getWorldCupFixtures()
  if (apiMatches.length === 0) return { error: 'No se recibieron datos de la API' }

  const { data: dbMatches } = await admin
    .from('matches')
    .select('id, match_number, home_team_id, away_team_id, status')
    .order('match_number', { ascending: true })

  if (!dbMatches) return { error: 'Error al leer partidos de la BD' }

  let updated = 0

  for (const apiMatch of apiMatches) {
    const dbStatus = mapApiStatus(apiMatch.statusShort)
    if (dbStatus === 'scheduled') continue

    const apiHomeId = findTeamId(apiMatch.homeTeam)
    const apiAwayId = findTeamId(apiMatch.awayTeam)
    if (!apiHomeId || !apiAwayId) continue

    const dbMatch = dbMatches.find(
      (m) =>
        m.home_team_id === apiHomeId &&
        m.away_team_id === apiAwayId &&
        m.status !== 'finished'
    )
    if (!dbMatch) continue

    const winnerId =
      apiMatch.homeWinner === true
        ? dbMatch.home_team_id
        : apiMatch.awayWinner === true
          ? dbMatch.away_team_id
          : null

    const updateData: Record<string, unknown> = {
      status: dbStatus,
      home_score: apiMatch.homeGoals,
      away_score: apiMatch.awayGoals,
      winner_id: winnerId,
    }

    if (apiMatch.homePenaltyScore != null) updateData.home_penalty_score = apiMatch.homePenaltyScore
    if (apiMatch.awayPenaltyScore != null) updateData.away_penalty_score = apiMatch.awayPenaltyScore
    if (apiMatch.scoreDuration) updateData.tie_breaker =
      apiMatch.scoreDuration === 'PENALTY_SHOOTOUT' ? 'penalties' :
      apiMatch.scoreDuration === 'EXTRA_TIME'
        ? (winnerId === dbMatch.home_team_id ? 'home_et' : 'away_et')
        : null

    const result = await admin
      .from('matches')
      .update(updateData)
      .eq('id', dbMatch.id)
    if (!result.error) updated++
  }

  const { data: rooms } = await admin.from('rooms').select('id')
  if (rooms) {
    for (const room of rooms) {
      revalidatePath(`/groups/${room.id}`)
    }
  }

  return { updated, total: apiMatches.length }
}
