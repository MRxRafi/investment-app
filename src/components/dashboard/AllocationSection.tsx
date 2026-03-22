import { AssetAllocationChart, PerformanceChart } from "../Charts";
import { DashboardStats } from "@/types";

export function AllocationSection({ stats }: { stats: DashboardStats }) {
  return (
    <div className="space-y-8 animate-slide-up [animation-delay:200ms]">
      {/* 1. Full-Width Performance Evolution */}
      <div className="glass-card p-6 md:p-10 min-h-[450px] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div className="space-y-1">
            <h3 className="text-xl md:text-2xl font-black font-outfit tracking-tighter text-white uppercase italic">
              Cartera vs <span className="text-yellow-500">MSCI World</span>
            </h3>
          </div>
          <div className="flex items-center space-x-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 font-plus-jakarta bg-black/40 px-4 py-2 rounded-lg border border-white/5">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-3 shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
              <span>Portfolio</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full border border-zinc-500 mr-3" />
              <span>Benchmark</span>
            </div>
          </div>
        </div>
        <div className="w-full overflow-hidden">
          <PerformanceChart data={stats.performanceData} />
        </div>
      </div>

      {/* 2. Allocation Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Allocation By Type */}
        <div className="glass-card p-8 flex flex-col min-h-[450px]">
          <div className="mb-8">
            <h3 className="text-lg font-black font-outfit tracking-tighter text-white uppercase italic mb-1">
              Asset <span className="text-yellow-500">Mix</span>
            </h3>
            <p className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase font-plus-jakarta">Exposure by Category</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <AssetAllocationChart data={stats.allocation} />
          </div>
        </div>

        {/* Individual Asset Allocation */}
        <div className="glass-card p-8 flex flex-col min-h-[450px]">
          <div className="mb-8">
            <h3 className="text-lg font-black font-outfit tracking-tighter text-white uppercase italic mb-1">
              Position <span className="text-yellow-500">Weight</span>
            </h3>
            <p className="text-[10px] text-zinc-500 font-bold tracking-[0.2em] uppercase font-plus-jakarta">Top Holdings Distribution</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <AssetAllocationChart data={stats.assetAllocation} />
          </div>
        </div>
      </div>
    </div>
  );
}
