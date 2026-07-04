import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data } = await supabase
    .from('matches')
    .select('match_number, round, home_team_id, away_team_id, match_date, status')
    .in('match_number', [83, 84, 85, 86, 87, 88, 89, 90, 91, 92])
    .order('match_number');
  console.log(data);
}
run().catch(console.error);
