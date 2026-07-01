import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const userId = 'd70a459a-4d04-447c-888a-bf1b885b31f8';
  
  const { data: members } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('user_id', userId);
    
  console.log('Room members:', members);
  
  const { data: predictions } = await supabase
    .from('predictions')
    .select('match_id, predicted_home_score, predicted_away_score, room_id')
    .eq('user_id', userId)
    .eq('match_id', 'fc05994e-ba49-4e38-98d2-c2f4ec96843f');
    
  console.log('Predictions:', predictions);
}

run().catch(console.error);
