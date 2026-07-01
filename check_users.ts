import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const profiles = await supabase.from('profiles').select('*');
  console.log('Profiles:', profiles.data);
  for (const u of users.users) {
    console.log(`User: ${u.id} - ${u.email}`);
  }
}

run().catch(console.error);
