import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  // Fix the 3 penalty matches: set tie_breaker = 'penalties'
  // Also fix scores: for penalties, keep 1-1 (regularTime) which is already correct
  
  // Match 75: GER 1-1 PRY, PRY won 4-3 on pens → tie_breaker = 'penalties', winner = pry
  await supabase.from('matches').update({ tie_breaker: 'penalties', winner_id: 'pry' })
    .eq('match_number', 75);
  
  // Match 76: NED 1-1 MAR, MAR won 3-2 on pens → tie_breaker = 'penalties', winner = mar
  await supabase.from('matches').update({ tie_breaker: 'penalties', winner_id: 'mar' })
    .eq('match_number', 76);
  
  // Match 86: AUS 1-1 EGY, EGY won 4-2 on pens → tie_breaker = 'penalties', winner = egy
  await supabase.from('matches').update({ tie_breaker: 'penalties', winner_id: 'egy' })
    .eq('match_number', 86);

  // Check Argentina match (87): ARG 3-2 CPV (ET) → tie_breaker = 'home_et', score should be 3-2
  const { data: argMatch } = await supabase.from('matches')
    .select('match_number, home_score, away_score, tie_breaker, winner_id')
    .eq('match_number', 87).single();
  console.log('ARG match before fix:', argMatch);
  
  // Fix ARG: score should be 3-2 (full score including ET), tie_breaker = home_et
  await supabase.from('matches').update({ 
    home_score: 3, away_score: 2, tie_breaker: 'home_et', winner_id: 'arg' 
  }).eq('match_number', 87);
  
  console.log('Fixed all penalty/ET matches');
}
run().catch(console.error);
