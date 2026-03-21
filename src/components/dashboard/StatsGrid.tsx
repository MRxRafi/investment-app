import { TrendingUp, Wallet, PieChart, ArrowUpRight } from "lucide-react";
import { SummaryCard } from "../SummaryCard";
import { DashboardStats } from "@/types";

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <SummaryCard 
        title="Patrimonio Total" 
        value={stats.totalValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} 
        change={`${stats.totalPnLPercent > 0 ? '+' : ''}${stats.totalPnLPercent.toFixed(1)}%`} 
        trend={stats.totalPnL >= 0 ? "up" : "down"} 
        icon={<Wallet className="w-5 h-5 text-blue-400" />} 
      />
      <SummaryCard 
        title="Rentabilidad Total" 
        value={`${stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`} 
        change={`${stats.totalPnLPercent > 0 ? '+' : ''}${stats.totalPnLPercent.toFixed(1)}%`} 
        trend={stats.totalPnL >= 0 ? "up" : "down"} 
        icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} 
      />
      <SummaryCard 
        title="Liquidez" 
        value={stats.liquidity.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} 
        change={`${((stats.liquidity / stats.totalValue) * 100).toFixed(1)}%`} 
        trend="neutral" 
        icon={<PieChart className="w-5 h-5 text-indigo-400" />} 
      />
      <SummaryCard 
        title="Mejor Activo" 
        value={stats.bestAsset ? `${stats.bestAsset.name} (${stats.bestAsset.pnlPercent.toFixed(1)}%)` : '---'} 
        icon={<ArrowUpRight className="w-5 h-5 text-amber-400" />} 
      />
    </div>
  );
}
