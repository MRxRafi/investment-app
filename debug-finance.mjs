import { calculateAssetStats, calculateDashboardStats } from './src/lib/finance.js';
import { supabase } from './src/lib/supabase.js';

async function debug() {
  const { data: assets } = await supabase.from('assets').select('*');
  const { data: transactions } = await supabase.from('transactions').select('*');
  
  const stats = calculateAssetStats(assets, transactions, {});
  const dashboard = calculateDashboardStats(stats, assets, []);
  
  console.log('--- ASSET STATS ---');
  stats.forEach(s => {
    console.log(`${s.name} (${s.ticker}): Qty=${s.quantity}, Inv=${s.invested}, Val=${s.currentValue}`);
  });
  
  console.log('\n--- DASHBOARD ---');
  console.log('Liquidity:', dashboard.liquidity);
  console.log('Total Value:', dashboard.totalValue);
  console.log('Total Invested:', dashboard.totalInvested);
}

debug();
