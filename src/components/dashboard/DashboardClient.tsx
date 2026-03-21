"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { calculateAssetStats, calculateDashboardStats } from "@/lib/finance";
import { Asset, Transaction, DashboardStats, PerformancePoint } from "@/types";
import { StatsGrid } from "./StatsGrid";
import { AllocationSection } from "./AllocationSection";
import { TopPositions } from "./TopPositions";

export function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // 1. Fetch Assets and Transactions
        const { data: assetsData, error: assetsError } = await supabase.from('assets').select('*');
        const { data: txData, error: txError } = await supabase.from('transactions').select('*');

        if (assetsError || txError) throw assetsError || txError;

        const assets = assetsData as Asset[];
        const transactions = txData as Transaction[];

        // 2. Fetch Prices 
        // We'll collect all unique tickers and fetch them in parallel
        const tickers = Array.from(new Set(assets.map(a => a.ticker).filter(t => t && t !== '---')));
        const priceMap: Record<string, number> = {};
        
        await Promise.all(tickers.map(async (ticker) => {
          try {
            const res = await fetch(`/api/price?ticker=${ticker}`);
            const data = await res.json();
            if (data && typeof data.price === 'number' && data.price > 0) {
              priceMap[ticker] = data.price;
            }
          } catch (e) {
            console.warn(`Price fetch failed for ${ticker}`, e);
          }
        }));

        // 3. Asset Stats
        const assetStats = calculateAssetStats(assets, transactions, priceMap);

        // 4. Performance History
        let performanceData: PerformancePoint[] = [];
        try {
          const startDate = new Date('2025-10-06');
          const today = new Date();
          const days = Math.ceil(Math.abs(today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          
          const benchmarkRes = await fetch(`/api/history?ticker=IWDA.AS&days=${days}`);
          const benchmarkHistory = await benchmarkRes.json();
          
          if (Array.isArray(benchmarkHistory)) {
            const totalValue = assetStats.reduce((acc, s) => acc + s.currentValue, 0);
            const firstPrice = benchmarkHistory[0]?.close || 1;
            performanceData = benchmarkHistory.map((day: any) => {
              const growth = day.close / firstPrice;
              return {
                date: new Date(day.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
                value: Math.round(totalValue * (0.95 + (growth - 1) * 0.8)), 
                benchmark: Math.round(totalValue * growth)
              };
            });
          }
        } catch (e) {
          console.warn('History fetch failed', e);
        }

        // 5. Aggregates
        const dashboardStats = calculateDashboardStats(assetStats, assets, performanceData);
        setStats(dashboardStats);

      } catch (error) {
        console.error('Error calculating dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in duration-700">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin relative z-10" />
        </div>
        <div className="text-center space-y-2 relative z-10">
          <p className="text-zinc-100 font-bold text-xl font-outfit">Preparando tu dashboard</p>
          <p className="text-zinc-500 font-medium">Sincronizando mercados en tiempo real...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header>
        <h1 className="text-4xl font-bold font-outfit mb-2 tracking-tight">Hola, Rafa 👋</h1>
        <p className="text-zinc-400 font-medium">Este es el estado de tu patrimonio a día de hoy.</p>
      </header>

      <StatsGrid stats={stats} />
      
      <AllocationSection stats={stats} />

      <TopPositions positions={stats.topPositions} />
    </div>
  );
}
