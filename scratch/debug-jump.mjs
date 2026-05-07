import { generatePerformanceData } from '../src/lib/finance';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
  console.log('Fetching data...');
  const { data: assets } = await supabase.from('assets').select('*');
  const { data: transactions } = await supabase.from('transactions').select('*');
  
  // Hardcoded for the problematic dates
  const startDate = new Date('2025-10-01');
  const endDate = new Date('2026-05-06');
  
  // We need to simulate the historyMap and benchmarkHistory
  // For this debug, we'll just use a mock or fetch if possible
  // But let's just see the transactions first
  console.log(`Found ${assets.length} assets and ${transactions.length} transactions`);
  
  // To keep it simple, let's just run it with what we have
  // We need dailyPrices and benchmarkHistory. 
  // Since I can't easily fetch Yahoo data here, I'll simulate a stable market
  // to see if the LOGIC itself causes the jump.
  
  const historyMap = {};
  assets.forEach(a => {
    if (a.ticker && a.ticker !== '---') {
      historyMap[a.ticker] = []; // Empty history means it uses lastKnownPrices (transaction fallback)
    }
  });
  
  const benchmarkHistory = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    benchmarkHistory.push({ date: current.toISOString().split('T')[0], close: 100 });
    current.setDate(current.getDate() + 1);
  }
  
  console.log('Generating performance data...');
  const result = generatePerformanceData(assets, transactions, historyMap, benchmarkHistory);
  
  console.log('Results around Dec 10, 2025:');
  result.filter(p => p.date >= '2025-12-08' && p.date <= '2025-12-15').forEach(p => {
    console.log(`${p.date} | Index: ${p.value.toFixed(4)} | AbsValue: ${p.absValue.toFixed(2)}€`);
  });
}

debug();
