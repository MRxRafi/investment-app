"use client";

import React from 'react';
import { 
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { TradingViewChart } from './TradingViewChart';
import { cn } from '@/lib/utils';

interface PerformanceData {
  date: string;
  value: number;
  benchmark: number;
}

interface AllocationData {
  name: string;
  value: number;
  category?: string;
}

const getAssetColor = (name: string, value: number, allData: AllocationData[], categoryColors: Record<string, string> = {}) => {
  const n = name.toLowerCase();
  const itemData = allData.find(d => d.name === name);
  const categoryStr = itemData?.category || '';

  if (categoryColors[categoryStr]) {
    return categoryColors[categoryStr];
  }
  
  // Fallback: if name matches a category (common in Asset Mix charts)
  if (itemData?.name && categoryColors[itemData.name]) {
    return categoryColors[itemData.name];
  }
  
  // 1. Quantum check (Special case for red)
  const isQuantum = n.includes('quantum');

  // Categorize based on the new English categories
  let colorCategory = 'blue'; 

  if (categoryStr === 'Crypto') {
    colorCategory = 'orange';
  } else if (categoryStr === 'Stock' || n.includes('action')) {
    colorCategory = 'purple';
  } else if (isQuantum || categoryStr === 'IT') {
    colorCategory = 'red';
  } else if (categoryStr === 'Commodity' || n.includes('gold') || n.includes('oro')) {
    colorCategory = 'yellow';
  } else if (categoryStr === 'Liquidity') {
    colorCategory = 'other';
  } else if (categoryStr === 'Fund') {
    colorCategory = 'blue';
  }

  // Muted "Clean Modern" Palettes
  const palettes: Record<string, { h: number, s: number, l: number }> = {
    blue: { h: 215, s: 35, l: 55 },   // Muted Sky Blue
    red: { h: 0, s: 35, l: 60 },      // Muted Rose (Base for IT)
    orange: { h: 25, s: 50, l: 55 },  // More pronounced Orange
    yellow: { h: 48, s: 70, l: 60 },  // Brighter, more saturated Yellow
    purple: { h: 265, s: 35, l: 60 }, // Muted Lavender (Slightly more saturated for "Action")
    other: { h: 240, s: 10, l: 60 }   // Soft Zinc
  };

  const base = palettes[colorCategory];

  // Quantum specific: LIGHTER RED
  if (isQuantum) {
    return `hsl(${base.h}, ${base.s}%, 75%)`; 
  }

  // FORCE consistent colors for Crypto (Orange), Stocks (Purple), etc.
  if (colorCategory === 'orange' || colorCategory === 'purple' || colorCategory === 'yellow') {
    return `hsl(${base.h}, ${base.s}%, ${base.l}%)`;
  }
  
  // Shading logic for Funds (Blue) - Darker for higher %, lighter for lower
  if (colorCategory === 'blue') {
    const group = allData.filter(item => item.category === 'Fund')
      .sort((a, b) => b.value - a.value);

    const rank = group.findIndex(item => item.name === name);
    const totalInGroup = group.length || 1;
    // Higher rank (index 0) = higher value = darker (lower L)
    // Lower rank = lower value = lighter (higher L)
    const intensity = totalInGroup > 1 ? (rank / (totalInGroup - 1)) : 0.5; 

    const s = 45; // Fixed saturation for consistency
    const l = 35 + (intensity * 40); // 35% (dark) to 75% (light)

    return `hsl(${base.h}, ${s}%, ${l}%)`;
  }

  return `hsl(${base.h}, ${base.s}%, ${base.l}%)`;
};

const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, value, name, percent } = props;
  const RADIAN = Math.PI / 180;
  
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 10;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';
  
  if (percent < 0.02) return null;

  const isPrint = typeof window !== 'undefined' && window.matchMedia('print').matches;
  const limit = isPrint ? 50 : 15;
  const truncatedName = name.length > limit ? `${name.substring(0, limit - 2)}...` : name;

  return (
    <g>
      <path 
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} 
        stroke={isPrint || props.isPrinting ? "#000000" : "#313136"} 
        fill="none" 
        strokeWidth={isPrint || props.isPrinting ? 2 : 1} 
      />
      <circle cx={ex} cy={ey} r={1.5} fill={isPrint || props.isPrinting ? "#000000" : "#71717a"} />
      <text 
        x={ex + (cos >= 0 ? 4 : -4)} 
        y={ey} 
        dy={4} 
        textAnchor={textAnchor} 
        fill={isPrint || props.isPrinting ? "#000000" : "#a1a1aa"} 
        fontSize={isPrint || props.isPrinting ? 12 : 9} 
        fontWeight={isPrint || props.isPrinting ? "800" : "normal"}
        className={cn(
          "font-plus-jakarta tracking-wider uppercase",
          isPrint || props.isPrinting ? "font-medium" : "font-bold"
        )}
      >
        {`${truncatedName} • ${value.toFixed(1)}%`}
      </text>
    </g>
  );
};

export function PerformanceChart({ 
  data = [], 
  height = 350,
  colors
}: { 
  data?: PerformanceData[], 
  height?: number,
  colors?: any 
}) {
  const chartData = data.map(d => ({
    time: d.date,
    value: d.value
  }));

  const benchmarkData = data.map(d => ({
    time: d.date,
    value: d.benchmark
  }));

  return (
    <div className="w-full mt-0 bg-transparent rounded-xl overflow-hidden">
      <TradingViewChart 
        data={chartData} 
        benchmarkData={benchmarkData}
        height={height}
        colors={colors}
      />
    </div>
  );
}

export function AssetAllocationChart({ 
  data = [],
  outerRadius = 110,
  innerRadius = 0,
  isPrinting = false,
  categoryColors = {}
}: { 
  data?: AllocationData[],
  outerRadius?: number,
  innerRadius?: number,
  isPrinting?: boolean,
  categoryColors?: Record<string, string>
}) {
  const activeData = data.map((entry, index) => ({
    ...entry,
    originalIndex: index
  }));

  const isPrint = (typeof window !== 'undefined' && window.matchMedia('print').matches) || isPrinting;

  return (
    <div className="h-[450px] w-full print:h-[650px] flex justify-center items-center overflow-visible mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart 
          margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
        >
          <Pie
            data={activeData}
            cx="50%" /* Always center the pie charts */
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius} 
            dataKey="value"
            isAnimationActive={!isPrint}
            stroke={isPrint ? "#ffffff" : "#09090b"}
            strokeWidth={isPrint ? 1 : 2}
            label={(props) => renderCustomizedLabel({ ...props, isPrinting: isPrint })}
            labelLine={false}
          >
            {activeData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getAssetColor(entry.name, entry.value, data, categoryColors)} 
                className="outline-none hover:opacity-90 cursor-pointer"
              />
            ))}
          </Pie>
          {/* Hide tooltip in print */}
          {!isPrint && (
            <RechartsTooltip 
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const sliceColor = getAssetColor(item.name, item.value, data, categoryColors);
                  return (
                    <div className="bg-zinc-900 border border-white/10 px-3 py-2 rounded-lg shadow-lg">
                      <div className="flex items-center space-x-2">
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sliceColor }} />
                         <p className="text-xs font-medium text-zinc-300">{item.name}: <span className="text-white font-bold">{item.value.toFixed(1)}%</span></p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
