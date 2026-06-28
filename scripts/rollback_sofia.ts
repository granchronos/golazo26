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

const insertedMatchIds = [
  '19e4b4de-ca1c-4c08-8abc-51998b736de9',
  '8c26fd36-09dd-4637-b6c7-cbeefa370cf1',
  '50f2ee25-4ca8-40b0-be58-9cee0233244e',
  '731e9452-519f-4c1c-8496-020bb4a04069',
  'bce1f698-878d-4828-adea-20184874658c',
  'ad781696-c3a3-4acd-a03d-084e9e55df17',
  'd3647401-1977-4afb-a968-bae168b0b3b0',
  '0475d06f-efd8-4584-8e7c-3fbc6345a2b1',
  '4b698fc5-2bd2-471e-8022-4ddbdce8ed17',
  'db1e4f30-e645-4a3e-91c1-0413ada4f75a',
  '247f02fe-f4f3-4b48-975c-ba46d688458a',
  '18c99db6-0737-407b-bbc4-40b89443f393',
  '742bf0a1-5fa8-4b90-84f6-ccd2bbcfa799',
  'f0bc922a-5911-4e98-82b4-f27111194cbb',
  '05760992-0eca-439c-8775-b19bf1ade820',
  'e97d33f8-32ed-41c3-914f-7865d7e58a2f',
  '4daee7e1-e52a-4328-9fb9-67772c4d3e30',
  'e054542f-866d-4a6e-83e4-5f17206622b5',
  '78e4325f-7601-4d63-b7ab-348713a5bac9',
  '33f80c69-5eb5-453b-be15-dc3e586b808d',
  '816b9f3c-5670-4de8-86bb-7139f8d42e30',
  'd94e2988-2213-4bad-9012-355b6111c1c5',
  'c9751d70-b5d0-4aa1-8cb5-4c1695348c90',
  '15431caf-69fc-4513-b856-74011a6fc346',
  'd5ec05d7-54b9-4452-aaa7-62f1d5c50f59'
]

async function run() {
  console.log('Rolling back restoration predictions for Sofia...')

  for (const matchId of insertedMatchIds) {
    const { error } = await admin
      .from('predictions')
      .delete()
      .eq('user_id', userId)
      .eq('room_id', roomId)
      .eq('match_id', matchId)

    if (error) {
      console.error(`Error deleting match ${matchId}:`, error.message)
    }
  }
  
  console.log('Predictions deleted successfully.')
  
  try {
    const { recalculateRoomScores } = await import('../app/actions/predictions')
    console.log('Recalculating room scores to 0...')
    await recalculateRoomScores(roomId)
    console.log('Scores recalculated successfully!')
  } catch (err) {
    console.error('Error recalculating scores:', err)
  }
}

run()
