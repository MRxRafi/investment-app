"use client";

import { useEffect, useState } from "react";
import { DashboardStats, Asset, Transaction, AssetStats, PerformancePoint } from "@/types";
import { StatsGrid } from "./StatsGrid";
import { AllocationSection } from "./AllocationSection";
import { TopPositions } from "./TopPositions";
import { supabase } from "@/lib/supabase";
import { getPrice, getHistory } from "@/lib/yahoo";
import { calculateAssetStats, calculateDashboardStats } from "@/lib/finance";
import { Loader2 } from "lucide-react";

export function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // 1. Fetch Assets and Transactions from Supabase
        const { data: assetsData, error: assetsError } = await supabase.from('assets').select('*');
        const { data: txData, error: txError } = await supabase.from('transactions').select('*');

        if (assetsError || txError) {
          throw new Error('Database fetch error');
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
          const benchmarkHistory = await getHistory('IWDA.AS', startDate, today);

          if (Array.isArray(benchmarkHistory) && benchmarkHistory.length > 0) {
            const activeStats = assetStats.filter(s => s.ticker !== 'CAPITAL');
            const totalValue = activeStats.reduce((acc, s) => acc + s.currentValue, 0);
            const totalInvested = activeStats.reduce((acc, s) => acc + s.invested, 0);
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
          console.warn('History fetch failed on client');
        }

        // 5. Calculate Final Dashboard Stats
        const finalStats = calculateDashboardStats(assetStats, assets, performanceData);
        setStats(finalStats);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="section-container flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
        <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest animate-pulse font-plus-jakarta">
          Initialising Strategic Overlook...
        </p>
      </div>
    );
  }

  return (
    <div className="section-container space-y-10 animate-fade-in py-6">
      <StatsGrid stats={stats} />
      <div className="space-y-10">
        <AllocationSection stats={stats} />
        <TopPositions positions={stats.topPositions} />
      </div>
    </div>
  );
}
