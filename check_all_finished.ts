import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { data } = await supabase
    .from('matches')
    .select('match_number, round, home_team_id, away_team_id, home_score, away_score, home_penalty_score, away_penalty_score, tie_breaker, winner_id, status')
    .eq('status', 'finished')
    .not('round', 'eq', 'group')
    .order('match_number');
  console.log('Finished knockout matches:', JSON.stringify(data, null, 2));
}
run().catch(console.error);
