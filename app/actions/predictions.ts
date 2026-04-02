'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { GROUP_STAGE_DEADLINE } from '@/lib/constants/points'
import { getMatchDeadline } from '@/lib/utils/date'
import type { GroupLetter } from '@/types/database'

// Save a knockout prediction by match_number (looks up UUID internally)
export async function saveKnockoutPrediction(
  roomId: string,
  matchNumber: number,
  predictedWinnerId: string,
  predictedHomeScore?: number | null,
  predictedAwayScore?: number | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const admin = await createAdminClient()

  const { data: match } = await admin
    .from('matches')
    .select('id, match_date')
    .eq('match_number', matchNumber)
    .single()

  if (!match) return { error: 'Partido no encontrado. Aplica la migración 006.' }

  const deadline = getMatchDeadline(match.match_date)
  if (new Date() > deadline) {
    return { error: 'Las apuestas para este partido ya están cerradas' }
  }

  const { error } = await admin
    .from('predictions')
    .upsert(
      {
        user_id: user.id,
        room_id: roomId,
        match_id: match.id,
        predicted_winner_id: predictedWinnerId,
        predicted_home_score: predictedHomeScore ?? null,
        predicted_away_score: predictedAwayScore ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,room_id,match_id' }
    )

  if (error) return { error: error.message }

  revalidatePath(`/groups/${roomId}`)
  return { success: true }
}

// Save a group match score prediction
export async function saveMatchScorePrediction(
  roomId: string,
  matchNumber: number,
  homeScore: number,
  awayScore: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const admin = await createAdminClient()

  const { data: match } = await admin
    .from('matches')
    .select('id, match_date, home_team_id, away_team_id')
    .eq('match_number', matchNumber)
    .single()

  if (!match) return { error: 'Partido no encontrado' }

  const deadline = getMatchDeadline(match.match_date)
  if (new Date() > deadline) {
    return { error: 'Las apuestas para este partido ya están cerradas' }
  }

  // Derive winner from predicted scores
  let predictedWinnerId: string
  if (homeScore > awayScore) predictedWinnerId = match.home_team_id!
  else if (awayScore > homeScore) predictedWinnerId = match.away_team_id!
  else predictedWinnerId = match.home_team_id! // draw defaults to home (group stage)

  const { error } = await admin
    .from('predictions')
    .upsert(
      {
        user_id: user.id,
        room_id: roomId,
        match_id: match.id,
        predicted_winner_id: predictedWinnerId,
        predicted_home_score: homeScore,
        predicted_away_score: awayScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,room_id,match_id' }
    )

  if (error) return { error: error.message }

  revalidatePath(`/groups/${roomId}`)
  return { success: true }
}

export async function saveGroupPrediction(
  roomId: string,
  groupLetter: GroupLetter,
  team1stId: string,
  team2ndId: string
) {
  if (new Date() > GROUP_STAGE_DEADLINE) {
    return { error: 'Las apuestas de grupos ya están cerradas' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const admin = await createAdminClient()

  const { error } = await admin
    .from('group_predictions')
    .upsert(
      {
        user_id: user.id,
        room_id: roomId,
        group_letter: groupLetter,
        team_1st_id: team1stId,
        team_2nd_id: team2ndId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,room_id,group_letter' }
    )

  if (error) return { error: error.message }

  revalidatePath(`/groups/${roomId}`)
  return { success: true }
}

export async function saveMatchPrediction(
  roomId: string,
  matchId: string,
  predictedWinnerId: string,
  matchDate: string
) {
  const deadline = getMatchDeadline(matchDate)
  if (new Date() > deadline) {
    return { error: 'Las apuestas para este partido ya están cerradas' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const admin = await createAdminClient()

  const { error } = await admin
    .from('predictions')
    .upsert(
      {
        user_id: user.id,
        room_id: roomId,
        match_id: matchId,
        predicted_winner_id: predictedWinnerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,room_id,match_id' }
    )

  if (error) return { error: error.message }

  revalidatePath(`/groups/${roomId}`)
  return { success: true }
}

export async function saveAllGroupPredictions(
  roomId: string,
  predictions: Array<{ groupLetter: GroupLetter; team1stId: string; team2ndId: string }>
) {
  if (new Date() > GROUP_STAGE_DEADLINE) {
    return { error: 'Las apuestas de grupos ya están cerradas' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const admin = await createAdminClient()

  const rows = predictions.map((p) => ({
    user_id: user.id,
    room_id: roomId,
    group_letter: p.groupLetter,
    team_1st_id: p.team1stId,
    team_2nd_id: p.team2ndId,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await admin
    .from('group_predictions')
    .upsert(rows, { onConflict: 'user_id,room_id,group_letter' })

  if (error) return { error: error.message }

  revalidatePath(`/groups/${roomId}`)
  return { success: true }
}
