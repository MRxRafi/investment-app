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

interface PerformanceData {
  date: string;
  value: number;
  benchmark: number;
}

interface AllocationData {
  name: string;
  value: number;
}

const getAssetColor = (name: string, value: number, allData: AllocationData[]) => {
  const n = name.toLowerCase();
  
  // Categorize
  let category = 'blue'; // Default to Blue for general funds
  if (n.includes('it') || n.includes('technology') || n.includes('tech') || n.includes('quantum')) {
    category = 'red';
  } else if (n.includes('bitcoin') || n.includes('btc') || n.includes('eth') || n.includes('crypto') || n.includes('cripto')) {
    category = 'orange';
  } else if (n.includes('gold') || n.includes('oro')) {
    category = 'yellow';
  } else if (n.includes('acciones') || n.includes('stocks') || n.includes('equity') || n.includes('action') || n.includes('amazon') || n.includes('apple') || n.includes('alphabet')) {
    category = 'purple';
  } else if (n.includes('cash') || n.includes('efectivo') || n.includes('liquid')) {
    category = 'other';
  }

  // Handle "Por Tipo" mapping
  if (name === 'Criptomonedas' || name === 'Cripto') category = 'orange';
  if (name === 'Oro' || name === 'Materias Primas') category = 'yellow';
  if (name === 'Renta Variable') category = 'blue';
  if (name === 'Acciones' || name === 'Action') category = 'purple';

  // Get all items in the same category to calculate shading
  const group = allData.filter(item => {
    const gn = item.name.toLowerCase();
    if (category === 'red') return gn.includes('it') || gn.includes('tech') || gn.includes('quantum');
    if (category === 'blue') return (gn.includes('msci') || gn.includes('world') || gn.includes('robeco') || gn.includes('global') || gn.includes('vanguard') || gn.includes('index')) && !gn.includes('tech');
    if (category === 'orange') return gn.includes('bitcoin') || gn.includes('btc') || gn.includes('eth') || gn.includes('crypto') || gn.includes('cripto');
    if (category === 'purple') return gn.includes('action') || gn.includes('accion') || gn.includes('stock') || gn.includes('equity');
    return false;
  }).sort((a, b) => b.value - a.value);

  const rank = group.findIndex(item => item.name.toLowerCase() === n);
  const totalInGroup = group.length || 1;
  // Intensity: 0 is highest % (darkest/most saturated), 1 is lowest % (lightest)
  const intensity = totalInGroup > 1 ? (rank / (totalInGroup - 1)) : 0; 

  // Muted "Clean Modern" Palettes (Ligher base to avoid "almost black")
  const palettes: Record<string, { h: number, s: number, l: number }> = {
    blue: { h: 215, s: 35, l: 55 },   // Muted Sky Blue
    red: { h: 0, s: 35, l: 60 },      // Muted Rose
    orange: { h: 25, s: 50, l: 55 },  // More pronounced Orange
    yellow: { h: 48, s: 70, l: 60 },  // Brighter, more saturated Yellow
    purple: { h: 265, s: 25, l: 60 }, // Muted Lavender
    other: { h: 240, s: 10, l: 60 }   // Soft Zinc
  };

  const base = palettes[category];

  // Specific requested overrides - Force all Bitcoin variants to the same pure orange
  if (n.includes('bitcoin') || n === 'btc' || name === 'Criptomonedas' || name === 'Cripto') {
    return `hsl(${palettes.orange.h}, ${palettes.orange.s}%, ${palettes.orange.l}%)`;
  }
  
  // Gold should always be the base bright yellow
  if (n.includes('gold') || n.includes('oro') || name === 'Oro' || name === 'Materias Primas') {
    return `hsl(${palettes.yellow.h}, ${palettes.yellow.s}%, ${palettes.yellow.l}%)`;
  }
  
  // Shading logic for others
  const s = Math.max(10, base.s + (totalInGroup > 1 ? (15 - intensity * 25) : 0));
  // Limit lightness to 80% to avoid disappearing on white paper
  const l = Math.min(80, base.l + (totalInGroup > 1 ? (-5 + intensity * 20) : 0));

  return `hsl(${base.h}, ${s}%, ${l}%)`;
};

const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, value, name, percent } = props;
  const RADIAN = Math.PI / 180;
  
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 5) * cos;
  const sy = cy + (outerRadius + 5) * sin;
  const mx = cx + (outerRadius + 15) * cos;
  const my = cy + (outerRadius + 15) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 8;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';
  
  if (percent < 0.02) return null;

  const isPrint = typeof window !== 'undefined' && window.matchMedia('print').matches;
  const limit = isPrint ? 13 : 15;
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
        fontWeight={isPrint || props.isPrinting ? "900" : "normal"}
        className="font-bold font-plus-jakarta tracking-wider uppercase"
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
    <div className="h-[450px] w-full print:h-[400px] flex justify-center items-center overflow-visible mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart 
          margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
        >
          <Pie
            data={activeData}
            cx={isPrint ? "75%" : "50%"} // Shift even further right in PDF
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={isPrint ? 80 : 80} // Back to 80 for more space
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
