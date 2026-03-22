import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { supabase } from "@/lib/supabase";
import { getPrice, getHistory } from "@/lib/yahoo";
import { calculateAssetStats, calculateDashboardStats } from "@/lib/finance";
import { Asset, Transaction, AssetStats, PerformancePoint } from "@/types";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // 1. Fetch Assets and Transactions from Supabase
  const { data: assetsData, error: assetsError } = await supabase.from('assets').select('*');
  const { data: txData, error: txError } = await supabase.from('transactions').select('*');

  if (assetsError || txError) {
    console.error('Database fetch error:', assetsError || txError);
    return <div className="p-8 text-red-400">Error cargando datos de la base de datos.</div>;
  }

  const assets = assetsData as Asset[];
  const transactions = txData as Transaction[];

  // 2. Fetch Current Prices in Parallel
  const tickers = Array.from(new Set(assets.map(a => a.ticker).filter(t => t && t !== '---')));
  const priceMap: Record<string, number> = {};

  await Promise.all(tickers.map(async (ticker) => {
    try {
      const priceData = await getPrice(ticker);
      if (priceData && typeof priceData.price === 'number') {
        priceMap[ticker] = priceData.price;
      }
    } catch (e) {
      console.warn(`Price fetch failed for ${ticker}`);
    }
  }));

  // 3. Calculate Asset Stats
  const assetStats = calculateAssetStats(assets, transactions, priceMap);

  // 4. Fetch History for Benchmark (IWDA.AS)
  let performanceData: PerformancePoint[] = [];
  try {
    const startDate = new Date('2025-10-06');
    const today = new Date();
    const days = Math.ceil(Math.abs(today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // We can use the library directly here
    const benchmarkHistory = await getHistory('IWDA.AS', startDate, today);

    if (Array.isArray(benchmarkHistory) && benchmarkHistory.length > 0) {
      const totalValue = assetStats.reduce((acc, s) => acc + s.currentValue, 0);
      const totalInvested = assetStats.reduce((acc, s) => acc + s.invested, 0);
      const firstPrice = benchmarkHistory[0]?.close || 1;
      const lastPrice = benchmarkHistory[benchmarkHistory.length - 1]?.close || 1;

      const totalGrowth = lastPrice / firstPrice;
      const targetEndValue = totalInvested * totalGrowth;
      const ratio = targetEndValue !== 0 ? totalValue / targetEndValue : 1;

      performanceData = benchmarkHistory.map((day: any, index: number) => {
        const dayGrowth = day.close / firstPrice;
        const progress = index / (benchmarkHistory.length - 1);
        const benchmarkValue = totalInvested * dayGrowth;
        const portfolioValue = benchmarkValue * Math.pow(ratio, progress);

        return {
          date: new Date(day.date).toISOString().split('T')[0],
          value: Math.round(portfolioValue),
          benchmark: Math.round(benchmarkValue)
        };
      });
    }
  } catch (e) {
    console.warn('History fetch failed on server');
  }

  // 5. Calculate Final Dashboard Stats
  const stats = calculateDashboardStats(assetStats, assets, performanceData);

  return <DashboardClient initialStats={stats} />;
}
