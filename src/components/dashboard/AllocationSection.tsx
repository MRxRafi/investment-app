import { AssetAllocationChart, PerformanceChart } from "../Charts";
import { DashboardStats } from "@/types";

export function AllocationSection({ stats }: { stats: DashboardStats }) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold font-outfit px-1">Evolución vs MSCI World</h3>
            <div className="flex items-center space-x-4 text-xs font-medium uppercase tracking-wider">
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-2 shadow-lg shadow-blue-600/20" />
                <span className="text-zinc-100">Cartera</span>
              </div>
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2 opacity-50 shadow-lg shadow-indigo-500/20" />
                <span className="text-zinc-400">MSCI World</span>
              </div>
            </div>
          </div>
          <PerformanceChart data={stats.performanceData} />
        </div>

        {/* Allocation Chart (By Tipo) */}
        <div className="glass-card">
          <h3 className="text-lg font-bold font-outfit mb-6">Distribución por Tipo</h3>
          <AssetAllocationChart data={stats.allocation} />
          <div className="mt-4 space-y-3">
            {stats.allocation.slice(0, 5).map((item, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-sm group">
                <div className="flex items-center">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 mr-2 group-hover:bg-blue-500 transition-colors" />
                   <span className="text-zinc-400 group-hover:text-zinc-300 transition-colors">{item.name}</span>
                </div>
                <span className="text-zinc-100 font-bold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Individual Asset Allocation Chart */}
        <div className="glass-card">
          <h3 className="text-lg font-bold font-outfit mb-6">Distribución por Activo</h3>
          <AssetAllocationChart data={stats.assetAllocation} />
          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3">
            {stats.assetAllocation.map((item, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-sm group">
                <div className="flex items-center overflow-hidden">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40 mr-2 shrink-0 group-hover:bg-indigo-500 transition-colors" />
                   <span className="text-zinc-400 truncate group-hover:text-zinc-300 transition-colors">{item.name}</span>
                </div>
                <span className="text-zinc-100 font-bold ml-2">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
