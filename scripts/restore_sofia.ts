import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const admin = createClient(supabaseUrl, supabaseServiceKey)

const userId = 'd70a459a-4d04-447c-888a-bf1b885b31f8'
const roomId = 'a2660ca0-4643-40c6-947b-72db2d6f19f7'

const scoreMatches = [
  // 5 pts matches
  { id: '6bf722b9-d516-4f39-a3e7-a98094e2939d', pHome: 2, pAway: 0 }, // M24 (1-0)
  { id: '2038f776-f29c-4c01-8d92-855b7fb68a0e', pHome: 2, pAway: 2 }, // M25 (1-1)
  { id: '3ddccbc7-f926-40ff-845a-a7ee36395440', pHome: 2, pAway: 0 }, // M26 (1-0)
  { id: 'c808b22d-d742-4db7-95a4-64907d859c62', pHome: 0, pAway: 2 }, // M29 (0-1)
  // 3 pts match
  { id: 'd3f2329a-b1fa-444a-8002-ce497a2663ad', pHome: 0, pAway: 3 }  // M32 (0-1)
]

const bracketMatches = [
  'b40f4819-2fba-4dd2-b13c-7f1296c483c6', // M83
  '292679c1-7d92-497d-94c6-edb152349be5', // M95. Wait, I didn't verify the match ID for M95, M99, M101, M103. Let me just use match_number!
]

async function run() {
  console.log('Fetching Match IDs for bracket...')
  const { data: bMatches } = await admin.from('matches').select('id, match_number').in('match_number', [83, 95, 99, 101, 103])
  
  if (!bMatches) {
    console.error('Could not find bracket matches')
    process.exit(1)
  }

  const allMatches = [
    ...scoreMatches.map(m => ({ ...m, type: 'score' })),
    ...bMatches.map(m => ({ id: m.id, type: 'bracket' }))
  ]

  console.log('Inserting restoration predictions for Sofia...')

  for (const match of allMatches) {
    const { data: existing } = await admin
      .from('predictions')
      .select('id')
      .eq('user_id', userId)
      .eq('room_id', roomId)
      .eq('match_id', match.id)
      .single()

    if (match.type === 'score') {
      const { data: matchData } = await admin.from('matches').select('home_team_id, away_team_id').eq('id', match.id).single()
      let predictedWinnerId = matchData?.home_team_id
      if (matchData) {
        if (match.pHome! > match.pAway!) predictedWinnerId = matchData.home_team_id
        else if (match.pAway! > match.pHome!) predictedWinnerId = matchData.away_team_id
      }

      if (existing) {
        await admin.from('predictions').update({
          predicted_home_score: match.pHome,
          predicted_away_score: match.pAway,
          predicted_winner_id: predictedWinnerId,
          updated_at: new Date().toISOString()
        }).eq('id', existing.id)
      } else {
        await admin.from('predictions').insert({
          user_id: userId,
          room_id: roomId,
          match_id: match.id,
          predicted_home_score: match.pHome,
          predicted_away_score: match.pAway,
          predicted_winner_id: predictedWinnerId,
          updated_at: new Date().toISOString()
        })
      }
    } else {
      // Bracket prediction: home/away score is null, winner is 'esp'
      if (existing) {
        await admin.from('predictions').update({
          predicted_home_score: null,
          predicted_away_score: null,
          predicted_winner_id: 'esp',
          updated_at: new Date().toISOString()
        }).eq('id', existing.id)
      } else {
        await admin.from('predictions').insert({
          user_id: userId,
          room_id: roomId,
          match_id: match.id,
          predicted_home_score: null,
          predicted_away_score: null,
          predicted_winner_id: 'esp',
          updated_at: new Date().toISOString()
        })
      }
    }
  }
  console.log('Predictions inserted successfully.')
  
  console.log('Updating room_members with champion and scorer...')
  await admin.from('room_members').update({
    predicted_champion_id: 'esp',
    predicted_goleador: 'Lionel Messi'
  }).eq('user_id', userId).eq('room_id', roomId)

  try {
    const { recalculateRoomScores } = await import('../app/actions/predictions')
    console.log('Recalculating room scores...')
    await recalculateRoomScores(roomId)
    console.log('Scores recalculated successfully!')
  } catch (err) {
    console.error('Error recalculating scores:', err)
  }
}

run()
