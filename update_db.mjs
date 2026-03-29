import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

let env = {};
try {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  });
} catch (e) { console.error('Error reading .env.local'); }

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { error: e1 } = await supabase.from('assets').update({ name: 'Capital Inicial', ticker: 'CAPITAL', tipo: 'Capital' }).eq('ticker', 'EURO');
  if (e1) console.error('Error updating EURO:', e1); 
  else console.log('Updated EURO to Capital Inicial!');
  
  const { data: d, error: e2 } = await supabase.from('assets').select('id').eq('ticker', 'DEBT');
  if (d && d.length === 0) {
    const { error: e3 } = await supabase.from('assets').insert([{ name: 'Deuda', ticker: 'DEBT', tipo: 'Deuda', current_price: 1.0, last_price_update: new Date().toISOString() }]);
    if (e3) console.error('Error inserting DEBT:', e3); 
    else console.log('Inserted Deuda!');
  } else {
    console.log('Deuda already exists');
  }
}
main();
