import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const userId = 'd70a459a-4d04-447c-888a-bf1b885b31f8';
  const matchId = 'fc05994e-ba49-4e38-98d2-c2f4ec96843f';
  
  const { data: rooms } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('user_id', userId);
    
  console.log('Rooms:', rooms);
  
  for (const r of rooms || []) {
    const { data, error } = await supabase
      .from('predictions')
      .upsert({
        user_id: userId,
        room_id: r.room_id,
        match_id: matchId,
        predicted_winner_id: 'eng',
        predicted_home_score: 3,
        predicted_away_score: 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id, room_id, match_id' });
      
    console.log(`Updated for room ${r.room_id}:`, error || 'Success');
  }
}

run().catch(console.error);
