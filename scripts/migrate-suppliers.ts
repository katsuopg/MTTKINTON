import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrate() {
  const data = JSON.parse(fs.readFileSync('/tmp/suppliers_data.json', 'utf-8'));
  
  console.log(`Migrating ${data.length} suppliers...`);
  
  const { error } = await supabase
    .from('suppliers')
    .upsert(data, { onConflict: 'kintone_record_id' });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Migration completed!');
  }
  
  const { count } = await supabase
    .from('suppliers')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Total: ${count}`);
}

migrate();
