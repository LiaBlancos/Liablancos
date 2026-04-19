import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({path: '.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: d, error: e } = await supabase.from('shipment_package_items').select('id').limit(1);
  console.log('shipment_package_items:', e ? e.message : 'EXISTS');
}
run();
