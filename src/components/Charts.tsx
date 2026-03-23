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
  type?: string;
}

const getAssetColor = (name: string, value: number, allData: AllocationData[]) => {
  const n = name.toLowerCase();
  const itemData = allData.find(d => d.name === name);
  const type = itemData?.type?.toLowerCase() || '';
  
  // Categorize
  let category = 'blue'; // Default to Blue for general funds

  // Crypto check (both by type and by name/ticker)
  if (type === 'criptomonedas' || type === 'crypto' || n.includes('bitcoin') || n.includes('btc') || n.includes('eth') || n.includes('crypto')) {
    category = 'orange';
  } 
  // Stocks check
  else if (type === 'acciones' || type === 'stocks' || type === 'action' || n.includes('amazon') || n.includes('apple') || n.includes('alphabet')) {
    category = 'purple';
  }
  // Tech/IT check
  else if (n.includes('it') || n.includes('technology') || n.includes('tech') || n.includes('quantum')) {
    category = 'red';
  } 
  // Gold check
  else if (n.includes('gold') || n.includes('oro') || type === 'oro' || type === 'materias primas') {
    category = 'yellow';
  }
  // Cash/Liquidity
  else if (n.includes('cash') || n.includes('efectivo') || n.includes('liquid') || type === 'liquidez') {
    category = 'other';
  }

  // Muted "Clean Modern" Palettes
  const palettes: Record<string, { h: number, s: number, l: number }> = {
    blue: { h: 215, s: 35, l: 55 },   // Muted Sky Blue
    red: { h: 0, s: 35, l: 60 },      // Muted Rose
    orange: { h: 25, s: 50, l: 55 },  // More pronounced Orange
    yellow: { h: 48, s: 70, l: 60 },  // Brighter, more saturated Yellow
    purple: { h: 265, s: 25, l: 60 }, // Muted Lavender
    other: { h: 240, s: 10, l: 60 }   // Soft Zinc
  };

  const base = palettes[category];

  // FORCE consistent colors for Stocks (Purple) and Crypto (Orange) as requested
  if (category === 'orange' || category === 'purple' || category === 'yellow') {
    return `hsl(${base.h}, ${base.s}%, ${base.l}%)`;
  }
  
  // Shading logic for others (Funds/ETF/Tech)
  // Get all items in the same category to calculate shading
  const group = allData.filter(item => {
    const gn = item.name.toLowerCase();
    const gt = item.type?.toLowerCase() || '';
    if (category === 'red') return gn.includes('it') || gn.includes('tech') || gn.includes('quantum');
    if (category === 'blue') return (gn.includes('msci') || gn.includes('world') || gn.includes('robeco') || gn.includes('global') || gn.includes('vanguard') || gn.includes('index')) && !gn.includes('tech');
    return false;
  }).sort((a, b) => b.value - a.value);

  const rank = group.findIndex(item => item.name === name);
  const totalInGroup = group.length || 1;
  const intensity = totalInGroup > 1 ? (rank / (totalInGroup - 1)) : 0; 

  const s = Math.max(10, base.s + (totalInGroup > 1 ? (15 - intensity * 25) : 0));
  const l = Math.min(80, base.l + (totalInGroup > 1 ? (-5 + intensity * 20) : 0));

  return `hsl(${base.h}, ${s}%, ${l}%)`;
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
  data, 
  height = 350,
  colors
}: { 
  data: PerformanceData[], 
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
  data,
  outerRadius = 110,
  innerRadius = 0,
  isPrinting = false
}: { 
  data: AllocationData[],
  outerRadius?: number,
  innerRadius?: number,
  isPrinting?: boolean
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
            outerRadius={140} 
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
                fill={getAssetColor(entry.name, entry.value, data)} 
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
                  const sliceColor = getAssetColor(item.name, item.value, data);
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
