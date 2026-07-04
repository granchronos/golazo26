import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { data } = await supabase
    .from('matches')
    .select('match_number, round, home_team_id, away_team_id, home_score, away_score, home_penalty_score, away_penalty_score, tie_breaker, status, winner_id')
    .not('tie_breaker', 'is', null)
    .order('match_number');
  console.log('Matches with tie_breaker:', JSON.stringify(data, null, 2));
  
  // Also check if there are penalty matches without tie_breaker set
  const { data: penMatches } = await supabase
    .from('matches')
    .select('match_number, home_team_id, away_team_id, home_score, away_score, home_penalty_score, away_penalty_score, tie_breaker')
    .not('home_penalty_score', 'is', null);
  console.log('\nMatches with penalty scores:', JSON.stringify(penMatches, null, 2));
}
run().catch(console.error);
