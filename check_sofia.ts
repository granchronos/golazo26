import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: preds } = await supabase
    .from('predictions')
    .select('match_id, predicted_home_score, predicted_away_score')
    .eq('user_id', 'd70a459a-4d04-447c-888a-bf1b885b31f8');
  console.log('Sofia preds:', preds);
}

run().catch(console.error);
