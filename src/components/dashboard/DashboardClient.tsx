"use client";

import { DashboardStats } from "@/types";
import { StatsGrid } from "./StatsGrid";
import { AllocationSection } from "./AllocationSection";
import { TopPositions } from "./TopPositions";

interface DashboardClientProps {
  initialStats: DashboardStats;
}

export function DashboardClient({ initialStats }: DashboardClientProps) {
  const stats = initialStats;

  return (
    <div className="section-container space-y-10 animate-fade-in py-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl md:text-4xl font-black font-outfit tracking-tight text-white">
          Resumen <span className="text-yellow-500">Global</span>
        </h1>
        <p className="text-zinc-500 text-sm font-medium font-plus-jakarta tracking-wide">
          Análisis de rendimiento y alocación estratégica de activos.
        </p>
      </div>

      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2">
          <AllocationSection stats={stats} />
        </div>
        <div>
          <TopPositions positions={stats.topPositions} />
        </div>
      </div>
    </div>
  );
}
