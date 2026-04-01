"use client";

import { useEffect, useState } from "react";
import { DashboardStats, Asset, Transaction, AssetStats, PerformancePoint } from "@/types";
import { StatsGrid } from "./StatsGrid";
import { AllocationSection } from "./AllocationSection";
import { TopPositions } from "./TopPositions";
import { getPrice, getHistory } from "@/lib/yahoo";
import { calculateAssetStats, calculateDashboardStats } from "@/lib/finance";
import { Loader2 } from "lucide-react";
import { useAssets } from "@/hooks/useAssets";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategoryColors } from "@/hooks/useCategoryColors";

export function DashboardClient() {
  const { assets, loading: assetsLoading } = useAssets();
  const { transactions, loading: txLoading } = useTransactions();
  const { colors: categoryColors } = useCategoryColors();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pricing, setPricing] = useState(false);

  useEffect(() => {
    if (assetsLoading || txLoading) return;
    if (assets.length === 0) {
      setStats(null);
      return;
    }

    async function calculate() {
      try {
        setPricing(true);
        // 1. Fetch Current Prices in Parallel
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

        // 2. Calculate Asset Stats
        const assetStats = calculateAssetStats(assets, transactions, priceMap);

        // 3. Fetch History for Benchmark (IWDA.AS)
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

            performanceData = benchmarkHistory.map((day: any, index: number) => {
              const dayGrowth = day.close / firstPrice;
              const progress = index / (benchmarkHistory.length - 1);
              const benchmarkValue = totalInvested * dayGrowth;
              // Simple growth ratio mapping
              const totalGrowth = benchmarkHistory[benchmarkHistory.length - 1].close / firstPrice;
              const targetEndValue = totalInvested * totalGrowth;
              const ratio = targetEndValue !== 0 ? totalValue / targetEndValue : 1;
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

        // 4. Calculate Final Dashboard Stats
        const finalStats = calculateDashboardStats(assetStats, assets, performanceData);
        setStats(finalStats);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setPricing(false);
      }
    }

    calculate();
  }, [assets, transactions, assetsLoading, txLoading]);

  if (assetsLoading || txLoading || pricing || !stats) {
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
        <AllocationSection stats={stats} categoryColors={categoryColors} />
        <TopPositions positions={stats.topPositions} />
      </div>
    </div>
  );
}
