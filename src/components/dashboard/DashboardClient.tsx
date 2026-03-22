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


      <StatsGrid stats={stats} />

      <div className="space-y-10">
        <AllocationSection stats={stats} />
        <TopPositions positions={stats.topPositions} />
      </div>
    </div>
  );
}
