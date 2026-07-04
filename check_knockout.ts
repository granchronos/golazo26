import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  // Check knockout predictions for Antony (main user)
  const userId = '59753fdb-b6f2-477b-90b2-7a226cf9845a';
  const { data } = await supabase
    .from('predictions')
    .select('match_id, predicted_winner_id, predicted_home_score, predicted_away_score')
    .eq('user_id', userId);
  
  // Get round_of_16 match IDs
  const { data: r16 } = await supabase
    .from('matches')
    .select('id, match_number, round, home_team_id, away_team_id')
    .eq('round', 'round_of_16');
  
  console.log('R16 matches:', r16);
  console.log('User predictions:', data?.filter(p => r16?.find(m => m.id === p.match_id)));
}
run().catch(console.error);
