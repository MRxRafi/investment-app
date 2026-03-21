import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  const { data: assets, error: aError } = await supabase.from('assets').select('*');
  const { data: txs, error: tError } = await supabase.from('transactions').select('*');

  if (aError) console.error('Assets error:', aError);
  if (tError) console.error('Transactions error:', tError);

  console.log(`Found ${assets?.length} assets and ${txs?.length} transactions.`);
  
  if (assets && txs) {
    const firstAsset = assets[0];
    const assetTxs = txs.filter(t => t.asset_id === firstAsset.id);
    console.log(`Asset ${firstAsset.name} (ID: ${firstAsset.id}) has ${assetTxs.length} transactions.`);
    
    // Check if IDs are strings or something else
    console.log(`Asset ID type: ${typeof firstAsset.id}`);
    console.log(`Transaction asset_id type: ${typeof txs[0].asset_id}`);
  }
}

debug();
