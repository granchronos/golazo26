import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  // Match 81: BEL 2-2 SEN, BEL won. Need to check if ET or penalties.
  // According to the data: no home_penalty_score, so it must be ET.
  // Belgium won in ET → tie_breaker = 'home_et' (bel is home)
  // Actually we need to verify: was it home_et or away_et?
  // BEL is home_team_id, so if BEL won in ET → 'home_et'
  
  const { data } = await supabase.from('matches').select('*').eq('match_number', 81).single();
  console.log('Match 81 full data:', data);
}
run().catch(console.error);
