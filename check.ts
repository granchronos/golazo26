import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const userId = 'd70a459a-4d04-447c-888a-bf1b885b31f8';
  
  const { data: matches } = await supabase
    .from('matches')
    .select('id, match_number, home_team_id, away_team_id')
    .or('home_team_id.eq.eng,away_team_id.eq.eng');
    
  console.log('Eng matches:', matches);
  
  const { data: predictions } = await supabase
    .from('predictions')
    .select('match_id, predicted_home_score, predicted_away_score, room_id')
    .eq('user_id', userId);
    
  console.log('User predictions for Eng matches:', predictions?.filter(p => matches?.find(m => m.id === p.match_id)));
}

run().catch(console.error);
