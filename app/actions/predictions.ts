'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  GROUP_STAGE_DEADLINE,
  CHAMPION_DEADLINE,
  GOLEADOR_DEADLINE,
  CHAMPION_GOLEADOR_DEADLINE,
  POINTS_SYSTEM,
  ROUND_POINTS,
  calculateMatchPoints,
  TEAM_BET_POINTS,
  NEXT_ROUND,
} from '@/lib/constants/points'
import { getMatchPredictionDeadline, getMatchDeadline } from '@/lib/utils/date'
import type { GroupLetter } from '@/types/database'
import { GROUP_LETTERS, TEAMS } from '@/lib/constants/teams'

// Save a knockout prediction by match_number (looks up UUID internally)
export async function saveKnockoutPrediction(
  roomId: string,
  matchNumber: number,
  predictedWinnerId: string,
  predictedHomeScore?: number | null,
  predictedAwayScore?: number | null
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const admin = await createAdminClient()

  const { data: match } = await admin
    .from('matches')
    .select('id, match_date, match_number')
    .eq('match_number', matchNumber)
    .single()

  if (!match) return { error: 'Partido no encontrado. Aplica la migración 006.' }

  const deadline = getMatchPredictionDeadline(match.match_number, match.match_date)
  if (new Date() > deadline) {
    return { error: 'Las apuestas para este partido ya están cerradas' }
  }

  const { error } = await admin.from('predictions').upsert(
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const admin = await createAdminClient()

  const { data: match } = await admin
    .from('matches')
    .select('id, match_date, match_number, home_team_id, away_team_id')
    .eq('match_number', matchNumber)
    .single()

  if (!match) return { error: 'Partido no encontrado' }

  const deadline = getMatchPredictionDeadline(match.match_number, match.match_date)
  if (new Date() > deadline) {
    return { error: 'Las apuestas para este partido ya están cerradas' }
  }

  // Derive winner from predicted scores
  let predictedWinnerId: string
  if (homeScore > awayScore) predictedWinnerId = match.home_team_id!
  else if (awayScore > homeScore) predictedWinnerId = match.away_team_id!
  else predictedWinnerId = match.home_team_id! // draw defaults to home (group stage)

  const { error } = await admin.from('predictions').upsert(
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const admin = await createAdminClient()

  const { error } = await admin.from('group_predictions').upsert(
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const admin = await createAdminClient()

  const { error } = await admin.from('predictions').upsert(
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
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

export async function saveAgnosticPredictions(
  roomId: string,
  championId: string | null,
  goleador: string
) {
  const now = new Date()
  const isChampionOpen = now <= CHAMPION_DEADLINE
  const isGoleadorOpen = now <= GOLEADOR_DEADLINE

  if (!isChampionOpen && !isGoleadorOpen) {
    return { error: 'El tiempo para escoger campeón y goleador ha expirado' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const admin = await createAdminClient()

  // Fetch current choices to preserve the locked one if necessary
  const { data: currentMember, error: fetchErr } = await admin
    .from('room_members')
    .select('predicted_champion_id, predicted_goleador')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .single()

  if (fetchErr) {
    return { error: 'Error al verificar las predicciones actuales: ' + fetchErr.message }
  }

  const updatePayload: any = {}

  if (isChampionOpen) {
    updatePayload.predicted_champion_id = championId || null
  } else {
    updatePayload.predicted_champion_id = currentMember?.predicted_champion_id || null
  }

  if (isGoleadorOpen) {
    updatePayload.predicted_goleador = goleador?.trim() || null
  } else {
    updatePayload.predicted_goleador = currentMember?.predicted_goleador || null
  }

  // Update room_members
  const { error } = await admin
    .from('room_members')
    .update(updatePayload)
    .eq('room_id', roomId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/groups/${roomId}`)
  return { success: true }
}

export async function saveMatchResult(
  matchId: string,
  roomId: string,
  homeScore: number,
  awayScore: number,
  status: 'scheduled' | 'live' | 'finished'
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const admin = await createAdminClient()

  // Verify room admin
  const { data: room } = await admin.from('rooms').select('admin_id').eq('id', roomId).single()

  if (!room || room.admin_id !== user.id) {
    return { error: 'Solo el administrador de la sala puede registrar resultados' }
  }

  // Get match teams to derive winner
  const { data: match } = await admin
    .from('matches')
    .select('home_team_id, away_team_id')
    .eq('id', matchId)
    .single()

  if (!match) return { error: 'Partido no encontrado' }

  let winnerId: string | null = null
  if (status === 'finished') {
    if (homeScore > awayScore) winnerId = match.home_team_id
    else if (awayScore > homeScore) winnerId = match.away_team_id
  }

  // Update match
  const { error: updateError } = await admin
    .from('matches')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      winner_id: winnerId,
      status,
    })
    .eq('id', matchId)

  if (updateError) return { error: updateError.message }

  // Recalculate scores for all rooms (since matches are global)
  await recalculateAllScores()

  revalidatePath(`/groups/${roomId}`)
  return { success: true }
}

export async function saveActualGoleador(roomId: string, actualGoleador: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const admin = await createAdminClient()

  // Verify room admin
  const { data: room } = await admin.from('rooms').select('admin_id').eq('id', roomId).single()

  if (!room || room.admin_id !== user.id) {
    return { error: 'Solo el administrador de la sala puede definir el goleador' }
  }

  // Update room
  const { error } = await admin
    .from('rooms')
    .update({ actual_goleador: actualGoleador?.trim() || null })
    .eq('id', roomId)

  if (error) return { error: error.message }

  // Recalculate scores for this room
  await recalculateRoomScores(roomId)

  revalidatePath(`/groups/${roomId}`)
  return { success: true }
}

export async function recalculateAllScores() {
  const admin = await createAdminClient()
  const { data: rooms } = await admin.from('rooms').select('id')
  if (!rooms) return

  for (const room of rooms) {
    await recalculateRoomScores(room.id)
  }
}

export async function recalculateRoomScores(roomId: string) {
  const admin = await createAdminClient()

  // Fetch all matches
  const { data: matches } = await admin.from('matches').select('*')
  if (!matches) return

  // Fetch all room members
  const { data: members } = await admin
    .from('room_members')
    .select('user_id, predicted_champion_id, predicted_goleador')
    .eq('room_id', roomId)
  if (!members) return

  // Fetch all match predictions for the room
  const { data: predictions } = await admin.from('predictions').select('*').eq('room_id', roomId)

  // Fetch all group predictions for the room
  const { data: groupPredictions } = await admin
    .from('group_predictions')
    .select('*')
    .eq('room_id', roomId)

  // Fetch actual goleador of the room
  const { data: roomData } = await admin
    .from('rooms')
    .select('actual_goleador')
    .eq('id', roomId)
    .single()
  const actualGoleador = roomData?.actual_goleador || null

  // Determine actual group standings dynamically based on matches
  const groupStandings: Record<string, string[]> = {} // group_letter -> [1st_team_id, 2nd_team_id]

  for (const letter of GROUP_LETTERS) {
    const groupMatches = matches.filter(
      (m) =>
        m.round === 'group' &&
        (TEAMS.find((t) => t.id === m.home_team_id)?.group_letter === letter ||
          TEAMS.find((t) => t.id === m.away_team_id)?.group_letter === letter)
    )

    const allGroupMatchesFinished =
      groupMatches.length === 6 && groupMatches.every((m) => m.status === 'finished')

    if (allGroupMatchesFinished) {
      // Calculate standings
      const teamsInGroup = TEAMS.filter((t) => t.group_letter === letter)
      const stats = teamsInGroup.map((team) => ({
        id: team.id,
        points: 0,
        gd: 0,
        gf: 0,
        ga: 0,
      }))

      for (const m of groupMatches) {
        const homeStat = stats.find((s) => s.id === m.home_team_id)!
        const awayStat = stats.find((s) => s.id === m.away_team_id)!

        const hs = m.home_score ?? 0
        const as = m.away_score ?? 0

        homeStat.gf += hs
        homeStat.ga = (homeStat.ga || 0) + as
        awayStat.gf += as
        awayStat.ga = (awayStat.ga || 0) + hs

        homeStat.gd = homeStat.gf - homeStat.ga
        awayStat.gd = awayStat.gf - awayStat.ga

        if (hs > as) {
          homeStat.points += 3
        } else if (as > hs) {
          awayStat.points += 3
        } else {
          homeStat.points += 1
          awayStat.points += 1
        }
      }

      // Sort standings: points desc, gd desc, gf desc
      stats.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.gd !== a.gd) return b.gd - a.gd
        return b.gf - a.gf
      })

      groupStandings[letter] = [stats[0].id, stats[1].id]
    }
  }

  // Build a set of teams that participated in each round (for team bets)
  const teamsInRounds: Record<string, Set<string>> = {}
  const tournamentWinnerId = matches.find(
    (m) => m.round === 'final' && m.status === 'finished' && m.winner_id
  )?.winner_id || null

  for (const match of matches) {
    if (match.status === 'finished') {
      if (!teamsInRounds[match.round]) teamsInRounds[match.round] = new Set()
      if (match.home_team_id) teamsInRounds[match.round].add(match.home_team_id)
      if (match.away_team_id) teamsInRounds[match.round].add(match.away_team_id)
    }
  }

  // Recalculate scores for each member
  for (const member of members) {
    let groupPoints = 0
    let knockoutPoints = 0
    let correctPredictionsCount = 0

    // 1. Match Score Predictions (new formula: sign + approximation)
    const memberPreds = (predictions || []).filter((p) => p.user_id === member.user_id)

    for (const match of matches) {
      const pred = memberPreds.find((p) => p.match_id === match.id)

      if (match.status === 'finished') {
        const isGroupMatch = match.round === 'group'

        // Score prediction: new formula
        if (pred && pred.predicted_home_score != null && pred.predicted_away_score != null) {
          const result = calculateMatchPoints(
            pred.predicted_home_score,
            pred.predicted_away_score,
            match.home_score ?? 0,
            match.away_score ?? 0
          )

          if (isGroupMatch) {
            groupPoints += result.total
          } else {
            knockoutPoints += result.total
          }

          if (result.total > 0) {
            correctPredictionsCount++
          }
        }

        // 2. Knockout Round Winner Predictions
        if (!isGroupMatch) {
          const roundPoints = ROUND_POINTS[match.round as keyof typeof ROUND_POINTS] || 0
          if (pred && pred.predicted_winner_id === match.winner_id && match.winner_id) {
            knockoutPoints += roundPoints
            // Only increment correctPredictionsCount if they hadn't already got points for score
            if (!(pred.predicted_home_score != null && pred.predicted_away_score != null)) {
              correctPredictionsCount++
            }
          }
        }
      }
    }

    // 2.5. Team Bets: derived from knockout bracket
    // If user predicts team X wins in round R, they implicitly predict X reaches NEXT_ROUND[R]
    for (const pred of memberPreds) {
      const match = matches.find((m) => m.id === pred.match_id)
      if (!match || match.round === 'group' || !pred.predicted_winner_id) continue

      const nextRound = NEXT_ROUND[match.round]
      if (!nextRound) continue

      const teamBetPts = TEAM_BET_POINTS[match.round] || 0
      if (teamBetPts === 0) continue

      if (nextRound === 'winner') {
        // Final winner = tournament winner
        if (tournamentWinnerId && pred.predicted_winner_id === tournamentWinnerId) {
          knockoutPoints += teamBetPts
        }
      } else {
        // Check if team actually participated in the next round
        const teamsInNext = teamsInRounds[nextRound]
        if (teamsInNext && teamsInNext.has(pred.predicted_winner_id)) {
          knockoutPoints += teamBetPts
        }
      }
    }

    // 3. Group Standings Predictions
    const memberGroupPreds = (groupPredictions || []).filter((gp) => gp.user_id === member.user_id)
    for (const gp of memberGroupPreds) {
      const actual = groupStandings[gp.group_letter]
      if (actual) {
        if (gp.team_1st_id === actual[0]) {
          groupPoints += POINTS_SYSTEM.groupStage.correct1st // 5 pts
        }
        if (gp.team_2nd_id === actual[1]) {
          groupPoints += POINTS_SYSTEM.groupStage.correct2nd // 5 pts
        }
      }
    }

    // 4. Agnostic Champion Prediction
    const finalMatch = matches.find((m) => m.round === 'final')
    if (finalMatch && finalMatch.status === 'finished' && finalMatch.winner_id) {
      if (member.predicted_champion_id === finalMatch.winner_id) {
        knockoutPoints += POINTS_SYSTEM.agnostic.champion // 15 pts
      }
    }

    // 5. Agnostic Top Scorer (Goleador) Prediction
    if (actualGoleador && member.predicted_goleador) {
      const predNorm = member.predicted_goleador
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      const actualNorm = actualGoleador
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      if (
        predNorm === actualNorm ||
        predNorm.includes(actualNorm) ||
        actualNorm.includes(predNorm)
      ) {
        knockoutPoints += POINTS_SYSTEM.agnostic.goleador // 10 pts
      }
    }

    // Upsert into scores table
    const totalPoints = groupPoints + knockoutPoints
    await admin.from('scores').upsert(
      {
        user_id: member.user_id,
        room_id: roomId,
        total_points: totalPoints,
        group_points: groupPoints,
        knockout_points: knockoutPoints,
        correct_predictions: correctPredictionsCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,room_id' }
    )
  }
}
