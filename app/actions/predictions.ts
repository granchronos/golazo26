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
import type { GroupLetter, TieBreaker } from '@/types/database'
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
  homeScore: number | null,
  awayScore: number | null,
  predictedTieBreaker?: TieBreaker | null,
  predictedHomePenaltyScore?: number | null,
  predictedAwayPenaltyScore?: number | null
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const admin = await createAdminClient()

  const { data: match } = await admin
    .from('matches')
    .select('id, match_date, match_number, home_team_id, away_team_id, round')
    .eq('match_number', matchNumber)
    .single()

  if (!match) return { error: 'Partido no encontrado' }

  const deadline = getMatchPredictionDeadline(match.match_number, match.match_date)
  if (new Date() > deadline) {
    return { error: 'Las apuestas para este partido ya están cerradas' }
  }

  // Derive winner from predicted scores (handle nulls as 0 for comparison)
  const hCalc = homeScore ?? 0
  const aCalc = awayScore ?? 0

  let predictedWinnerId: string
  if (hCalc > aCalc) {
    predictedWinnerId = match.home_team_id!
  } else if (aCalc > hCalc) {
    predictedWinnerId = match.away_team_id!
  } else {
    if (match.round !== 'group') {
      if (
        predictedTieBreaker === 'home_et' ||
        (predictedTieBreaker === 'penalties' && (predictedHomePenaltyScore ?? 0) > (predictedAwayPenaltyScore ?? 0))
      ) {
        predictedWinnerId = match.home_team_id!
      } else if (
        predictedTieBreaker === 'away_et' ||
        (predictedTieBreaker === 'penalties' && (predictedAwayPenaltyScore ?? 0) > (predictedHomePenaltyScore ?? 0))
      ) {
        predictedWinnerId = match.away_team_id!
      } else {
        predictedWinnerId = match.home_team_id!
      }
    } else {
      predictedWinnerId = match.home_team_id! // draw defaults to home (group stage)
    }
  }

  const { error } = await admin.from('predictions').upsert(
    {
      user_id: user.id,
      room_id: roomId,
      match_id: match.id,
      predicted_winner_id: predictedWinnerId,
      predicted_home_score: homeScore,
      predicted_away_score: awayScore,
      predicted_tie_breaker: predictedTieBreaker ?? null,
      predicted_home_penalty_score: predictedHomePenaltyScore ?? null,
      predicted_away_penalty_score: predictedAwayPenaltyScore ?? null,
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

  interface RoomMemberUpdate {
    predicted_champion_id?: string | null
    predicted_goleador?: string | null
  }

  const updatePayload: RoomMemberUpdate = {}

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
  status: 'scheduled' | 'live' | 'finished',
  tieBreaker?: TieBreaker | null,
  homePenaltyScore?: number | null,
  awayPenaltyScore?: number | null
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
    else if (
      tieBreaker === 'home_et' ||
      (tieBreaker === 'penalties' && (homePenaltyScore ?? 0) > (awayPenaltyScore ?? 0))
    ) {
      winnerId = match.home_team_id
    } else if (
      tieBreaker === 'away_et' ||
      (tieBreaker === 'penalties' && (awayPenaltyScore ?? 0) > (homePenaltyScore ?? 0))
    ) {
      winnerId = match.away_team_id
    }
  }

  // Update match
  const { error: updateError } = await admin
    .from('matches')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      winner_id: winnerId,
      status,
      tie_breaker: tieBreaker ?? null,
      home_penalty_score: homePenaltyScore ?? null,
      away_penalty_score: awayPenaltyScore ?? null,
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

  await Promise.all(rooms.map((room) => recalculateRoomScores(room.id)))
}

export async function recalculateRoomScores(roomId: string) {
  const admin = await createAdminClient()

  // Fetch all data in parallel
  const [{ data: matches }, { data: members }, { data: predictions }, { data: groupPredictions }, { data: roomData }] =
    await Promise.all([
      admin.from('matches').select('*'),
      admin.from('room_members').select('user_id, predicted_champion_id, predicted_goleador').eq('room_id', roomId),
      admin.from('predictions').select('*').eq('room_id', roomId),
      admin.from('group_predictions').select('*').eq('room_id', roomId),
      admin.from('rooms').select('actual_goleador').eq('id', roomId).single(),
    ])

  if (!matches || !members) return

  const actualGoleador = roomData?.actual_goleador || null

  // O(1) team→group lookup
  const teamGroupMap = new Map(TEAMS.map((t) => [t.id, t.group_letter]))

  // O(1) match lookup by ID
  const matchById = new Map(matches.map((m) => [m.id, m]))

  // Pre-index member predictions
  const predsByUser = new Map<string, typeof predictions>()
  for (const pred of predictions || []) {
    const arr = predsByUser.get(pred.user_id) || []
    arr.push(pred)
    predsByUser.set(pred.user_id, arr)
  }

  const groupPredsByUser = new Map<string, typeof groupPredictions>()
  for (const gp of groupPredictions || []) {
    const arr = groupPredsByUser.get(gp.user_id) || []
    arr.push(gp)
    groupPredsByUser.set(gp.user_id, arr)
  }

  // Determine actual group standings dynamically based on matches
  const groupStandings: Record<string, string[]> = {}

  for (const letter of GROUP_LETTERS) {
    const groupMatches = matches.filter(
      (m) =>
        m.round === 'group' &&
        (teamGroupMap.get(m.home_team_id!) === letter ||
          teamGroupMap.get(m.away_team_id!) === letter)
    )

    const allGroupMatchesFinished =
      groupMatches.length === 6 && groupMatches.every((m) => m.status === 'finished')

    if (allGroupMatchesFinished) {
      const teamsInGroup = TEAMS.filter((t) => t.group_letter === letter)
      const statsMap = new Map(teamsInGroup.map((team) => [team.id, { id: team.id, points: 0, gf: 0, ga: 0, gd: 0 }]))

      for (const m of groupMatches) {
        const homeStat = statsMap.get(m.home_team_id!)!
        const awayStat = statsMap.get(m.away_team_id!)!

        const hs = m.home_score ?? 0
        const as = m.away_score ?? 0

        homeStat.gf += hs
        homeStat.ga += as
        awayStat.gf += as
        awayStat.ga += hs

        if (hs > as) {
          homeStat.points += 3
        } else if (as > hs) {
          awayStat.points += 3
        } else {
          homeStat.points += 1
          awayStat.points += 1
        }
      }

      const stats = Array.from(statsMap.values()).map((s) => ({ ...s, gd: s.gf - s.ga }))
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
  let tournamentWinnerId: string | null = null

  for (const match of matches) {
    if (match.status === 'finished') {
      if (!teamsInRounds[match.round]) teamsInRounds[match.round] = new Set()
      if (match.home_team_id) teamsInRounds[match.round].add(match.home_team_id)
      if (match.away_team_id) teamsInRounds[match.round].add(match.away_team_id)
    }
    if (match.round === 'final' && match.status === 'finished' && match.winner_id) {
      tournamentWinnerId = match.winner_id
    }
  }

  const finalMatch = matches.find((m) => m.round === 'final')

  // Recalculate scores for each member
  const scoreUpdates: Promise<{ error: unknown }>[] = []

  for (const member of members) {
    let groupPoints = 0
    let knockoutPoints = 0
    let correctPredictionsCount = 0

    const memberPreds = predsByUser.get(member.user_id) || []

    for (const match of matches) {
      const pred = memberPreds.find((p) => p.match_id === match.id)

      if (match.status === 'finished') {
        const isGroupMatch = match.round === 'group'

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

        if (!isGroupMatch) {
          const roundPoints = ROUND_POINTS[match.round as keyof typeof ROUND_POINTS] || 0
          if (pred && pred.predicted_winner_id === match.winner_id && match.winner_id) {
            knockoutPoints += roundPoints
            if (!(pred.predicted_home_score != null && pred.predicted_away_score != null)) {
              correctPredictionsCount++
            }
          }

          if (match.tie_breaker && match.winner_id) {
            if (pred && pred.predicted_tie_breaker === match.tie_breaker) {
              knockoutPoints += POINTS_SYSTEM.tieBreaker || 3

              if (
                match.tie_breaker === 'penalties' &&
                pred.predicted_home_penalty_score != null &&
                pred.predicted_away_penalty_score != null &&
                match.home_penalty_score != null &&
                match.away_penalty_score != null
              ) {
                const penaltyResult = calculateMatchPoints(
                  pred.predicted_home_penalty_score,
                  pred.predicted_away_penalty_score,
                  match.home_penalty_score,
                  match.away_penalty_score
                )
                knockoutPoints += penaltyResult.total
              }
            }
          }
        }
      }
    }

    // Team Bets: derived from knockout bracket
    for (const pred of memberPreds) {
      const match = matchById.get(pred.match_id)
      if (!match || match.round === 'group' || !pred.predicted_winner_id) continue

      const nextRound = NEXT_ROUND[match.round]
      if (!nextRound) continue

      const teamBetPts = TEAM_BET_POINTS[match.round] || 0
      if (teamBetPts === 0) continue

      if (nextRound === 'winner') {
        if (tournamentWinnerId && pred.predicted_winner_id === tournamentWinnerId) {
          knockoutPoints += teamBetPts
        }
      } else {
        const teamsInNext = teamsInRounds[nextRound]
        if (teamsInNext && teamsInNext.has(pred.predicted_winner_id)) {
          knockoutPoints += teamBetPts
        }
      }
    }

    // Group Standings Predictions
    const memberGroupPreds = groupPredsByUser.get(member.user_id) || []
    for (const gp of memberGroupPreds) {
      const actual = groupStandings[gp.group_letter]
      if (actual) {
        if (gp.team_1st_id === actual[0]) {
          groupPoints += POINTS_SYSTEM.groupStage.correct1st
        }
        if (gp.team_2nd_id === actual[1]) {
          groupPoints += POINTS_SYSTEM.groupStage.correct2nd
        }
      }
    }

    // Agnostic Champion Prediction
    if (finalMatch && finalMatch.status === 'finished' && finalMatch.winner_id) {
      if (member.predicted_champion_id === finalMatch.winner_id) {
        knockoutPoints += POINTS_SYSTEM.agnostic.champion
      }
    }

    // Agnostic Top Scorer (Goleador) Prediction
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
        knockoutPoints += POINTS_SYSTEM.agnostic.goleador
      }
    }

    const totalPoints = groupPoints + knockoutPoints
    scoreUpdates.push(
      Promise.resolve(
        admin.from('scores').upsert(
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
      ).then(() => ({ error: null }))
    )
  }

  await Promise.all(scoreUpdates)
}
