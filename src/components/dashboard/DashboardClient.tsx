"use client";

import { useEffect, useState } from "react";
import { DashboardStats, Asset, Transaction, AssetStats, PerformancePoint } from "@/types";
import { StatsGrid } from "./StatsGrid";
import { AllocationSection } from "./AllocationSection";
import { TopPositions } from "./TopPositions";
import { getPrice, getHistory } from "@/lib/yahoo";
import { getSGPrice, getSGHistory, isSGTicker } from "@/lib/sg";
import { calculateAssetStats, calculateDashboardStats, generatePerformanceData } from "@/lib/finance";
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
        // 1. Fetch Current Prices and Histories in Parallel
        const tickers = Array.from(new Set(assets.map(a => a.ticker).filter(t => t && t !== '---')));
        const priceMap: Record<string, number> = {};
        const historyMap: Record<string, any[]> = {};

        // Dynamic start date based on first transaction
        const startDate = transactions.length > 0
          ? new Date(Math.min(...transactions.map(t => new Date(t.date).getTime())))
          : new Date('2025-10-06');
        const today = new Date();

        await Promise.all(tickers.map(async (ticker) => {
          try {
            const isSG = isSGTicker(ticker);
            const [priceData, historyData] = await Promise.all([
              isSG ? getSGPrice(ticker) : getPrice(ticker),
              isSG ? getSGHistory(ticker) : getHistory(ticker, startDate, today)
            ]);

            if (priceData && typeof priceData.price === 'number') {
              priceMap[ticker] = priceData.price;
            }
            if (Array.isArray(historyData) && historyData.length > 0) {
              // Normalize history data format if needed
              historyMap[ticker] = historyData.map(h => ({
                date: h.date instanceof Date ? h.date.toISOString().split('T')[0] : h.date,
                close: h.close
              }));
            }
          } catch (e) {
            console.warn(`Data fetch failed for ${ticker}`);
          }
        }));

        // 2. Calculate Asset Stats
        const assetStats = calculateAssetStats(assets, transactions, priceMap);

        // 3. Fetch History for Benchmark (IWDA.AS) and generate performance
        let performanceData: PerformancePoint[] = [];
        try {
          const [benchmarkHistory, benchmarkLive] = await Promise.all([
            getHistory('IWDA.AS', startDate, today),
            getPrice('IWDA.AS')
          ]);

          if (Array.isArray(benchmarkHistory) && benchmarkHistory.length > 0) {
            // Inject Live Prices into Histories for "Today" points
            const todayStr = new Date().toISOString().split('T')[0];

            // Inject into Assets
            Object.keys(historyMap).forEach(ticker => {
              if (priceMap[ticker] !== undefined) {
                const history = historyMap[ticker];
                const lastEntry = history[history.length - 1];
                if (lastEntry && lastEntry.date !== todayStr) {
                  history.push({ date: todayStr, close: priceMap[ticker] });
                }
              }
            });

            // Inject into Benchmark
            if (benchmarkLive && typeof benchmarkLive.price === 'number') {
              const lastB = benchmarkHistory[benchmarkHistory.length - 1];
              if (lastB && lastB.date !== todayStr) {
                benchmarkHistory.push({ date: todayStr, close: benchmarkLive.price });
              }
            }

            performanceData = generatePerformanceData(assets, transactions, historyMap, benchmarkHistory);
          }
        } catch (e) {
          console.warn('History fetch failed on client', e);
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
