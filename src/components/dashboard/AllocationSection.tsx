import { AssetAllocationChart, PerformanceChart } from "../Charts";
import { DashboardStats } from "@/types";

export function AllocationSection({ stats }: { stats: DashboardStats }) {
  return (
    <div className="space-y-12 animate-slide-up [animation-delay:400ms]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Performance Evolution */}
        <div className="lg:col-span-2 glass-card overflow-hidden group/perf">
          <div className="flex justify-between items-center mb-8 px-2">
            <div className="space-y-1">
              <h3 className="text-xl font-black font-outfit tracking-tighter text-white/90">
                Evolución Patrimonio
              </h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Comparativa vs Benchmark Global</p>
            </div>
            <div className="flex items-center space-x-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-2 shadow-lg shadow-blue-600/20" />
                <span className="text-zinc-300">Cartera</span>
              </div>
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500/30 border border-indigo-500/50 mr-2" />
                <span className="text-zinc-500">MSCI World</span>
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <PerformanceChart data={stats.performanceData} />
          </div>
        </div>

        {/* Allocation (By Tipo) */}
        <div className="glass-card group/alloc">
          <div className="flex justify-between items-center mb-10 px-2">
            <h3 className="text-xl font-black font-outfit tracking-tighter text-white/90">
              Por Tipo
            </h3>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Distribution</span>
          </div>
          <AssetAllocationChart data={stats.allocation} />
          <div className="mt-8 space-y-5 px-2">
            {stats.allocation.slice(0, 4).map((item, idx: number) => (
              <div key={idx} className="group/item">
                <div className="flex items-center mb-1">
                  <div className="w-1 h-3 rounded-full bg-blue-500/20 mr-2 group-hover/item:bg-blue-500 transition-colors" />
                  <span className="text-[10px] font-black text-zinc-500 group-hover/item:text-zinc-300 transition-colors uppercase tracking-widest leading-none">{item.name}</span>
                </div>
                <span className="text-xl font-black text-white italic tracking-tighter pl-3">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Individual Asset Allocation */}
        <div className="glass-card">
          <div className="flex justify-between items-center mb-10 px-2">
            <h3 className="text-xl font-black font-outfit tracking-tighter text-white/90">
              Por Activo Individual
            </h3>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Asset Mix</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <AssetAllocationChart data={stats.assetAllocation} />
            <div className="space-y-4">
              {stats.assetAllocation.slice(0, 6).map((item, idx: number) => (
                <div key={idx} className="group/item border-l border-white/[0.03] pl-4 hover:border-indigo-500/50 transition-colors pb-1">
                  <span className="block text-[10px] font-black text-zinc-500 group-hover/item:text-zinc-400 transition-colors uppercase tracking-widest mb-0.5">{item.name}</span>
                  <span className="text-sm font-black text-zinc-100 italic tracking-tighter">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
