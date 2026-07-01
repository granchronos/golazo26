import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: predictions } = await supabase
    .from('predictions')
    .select('user_id, predicted_home_score, predicted_away_score')
    .eq('match_id', 'fc05994e-ba49-4e38-98d2-c2f4ec96843f');
    
  console.log('All predictions for Eng vs Cod:', predictions);
}

run().catch(console.error);
