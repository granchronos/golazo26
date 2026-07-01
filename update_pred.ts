import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const userId = 'dfeaa6dc-3561-4313-b0e3-0a672703e583';

  // 1. Get match
  const { data: match } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id')
    .or('home_team_id.eq.civ,away_team_id.eq.civ')
    .or('home_team_id.eq.nor,away_team_id.eq.nor')
    .single();

  if (!match) {
    console.error('Match not found');
    return;
  }
  console.log('Match:', match);

  // 2. Get room
  const { data: rooms } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('user_id', userId);
    
  if (!rooms || rooms.length === 0) {
    console.error('User not in any room');
    return;
  }
  const roomId = rooms[0].room_id;
  console.log('Room ID:', roomId);

  // 3. Upsert prediction
  // 2-3 in favor of Norway. Wait, if home is civ and away is nor, it's 2-3.
  let predicted_home_score = 2;
  let predicted_away_score = 3;
  let predicted_winner_id = 'nor';
  
  if (match.home_team_id === 'nor') {
    predicted_home_score = 3;
    predicted_away_score = 2;
  }

  const { error } = await supabase.from('predictions').upsert({
    user_id: userId,
    room_id: roomId,
    match_id: match.id,
    predicted_winner_id,
    predicted_home_score,
    predicted_away_score,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,room_id,match_id' });

  if (error) {
    console.error('Upsert error:', error);
    return;
  }
  
  console.log('Prediction updated successfully');
}

run().catch(console.error);
