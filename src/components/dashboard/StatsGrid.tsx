import { TrendingUp, Wallet, PieChart, ArrowUpRight } from "lucide-react";
import { SummaryCard } from "../SummaryCard";
import { DashboardStats } from "@/types";

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <SummaryCard
        title="Patrimonio Total"
        value={stats.totalValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
        change={`${stats.totalPnLPercent > 0 ? '+' : ''}${stats.totalPnLPercent.toFixed(1)}%`}
        trend={stats.totalPnL >= 0 ? "up" : "down"}
        icon={<Wallet className="w-5 h-5 text-blue-500/50" />}
      />
      <SummaryCard
        title="Rentabilidad"
        value={`${stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}`}
        change={`${stats.totalPnLPercent > 0 ? '+' : ''}${stats.totalPnLPercent.toFixed(1)}%`}
        trend={stats.totalPnL >= 0 ? "up" : "down"}
        icon={<TrendingUp className="w-5 h-5 text-emerald-500/50" />}
      />
      <SummaryCard
        title="Capital Inicial"
        value={stats.capitalInicial.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
        change={`${((stats.capitalInicial / stats.totalValue) * 100).toFixed(1)}%`}
        trend="neutral"
        icon={<PieChart className="w-5 h-5 text-zinc-500/50" />}
      />
      <SummaryCard
        title="Top Alfa"
        value={stats.bestAsset ? stats.bestAsset.ticker : '---'}
        change={stats.bestAsset ? `+${stats.bestAsset.pnlPercent.toFixed(1)}%` : undefined}
        trend={stats.bestAsset && stats.bestAsset.pnl > 0 ? "up" : "neutral"}
        icon={<ArrowUpRight className="w-5 h-5 text-yellow-500/50" />}
      />
    </div>
  );
}
