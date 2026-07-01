import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const matchId = 'fc05994e-ba49-4e38-98d2-c2f4ec96843f';
  
  const { data: users } = await supabase
    .from('profiles')
    .select('id, username');
    
  console.log('Users:', users);
}

run().catch(console.error);
