import { SummaryCard } from "@/components/SummaryCard";
import { PerformanceChart, AssetAllocationChart } from "@/components/Charts";
import { ArrowUpRight, TrendingUp, Wallet, PieChart } from "lucide-react";

const MOCK_PERFORMANCE = [
  { date: 'Gen', value: 45000, benchmark: 42000 },
  { date: 'Feb', value: 47000, benchmark: 43500 },
  { date: 'Mar', value: 46500, benchmark: 43000 },
  { date: 'Apr', value: 49000, benchmark: 45000 },
  { date: 'Mag', value: 52000, benchmark: 46000 },
  { date: 'Giu', value: 55000, benchmark: 48000 },
];

const MOCK_ALLOCATION = [
  { name: 'Acciones', value: 65 },
  { name: 'ETFs', value: 20 },
  { name: 'Fondos', value: 10 },
  { name: 'Liquidez', value: 5 },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold font-outfit mb-2">Hola, Rafa 👋</h1>
        <p className="text-zinc-400">Aquí tienes el resumen de tus inversiones hoy.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="Patrimonio Total" 
          value="55.240,42 €" 
          change="+12.5%" 
          trend="up" 
          icon={<Wallet className="w-5 h-5" />} 
        />
        <SummaryCard 
          title="Rentabilidad (YTD)" 
          value="+6.420 €" 
          change="+8.2%" 
          trend="up" 
          icon={<TrendingUp className="w-5 h-5" />} 
        />
        <SummaryCard 
          title="Liquidez" 
          value="2.760,00 €" 
          change="5.0%" 
          trend="neutral" 
          icon={<PieChart className="w-5 h-5" />} 
        />
        <SummaryCard 
          title="Mejor Activo" 
          value="NVIDIA (+45%)" 
          icon={<ArrowUpRight className="w-5 h-5" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 glass-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold font-outfit">Evolución vs MSCI World</h3>
            <div className="flex items-center space-x-4 text-xs font-medium uppercase tracking-wider">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-600 mr-2" />
                <span className="text-zinc-100">Cartera</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2 opacity-50" />
                <span className="text-zinc-400">MSCI World</span>
              </div>
            </div>
          </div>
          <PerformanceChart data={MOCK_PERFORMANCE} />
        </div>

        {/* Allocation Chart */}
        <div className="glass-card">
          <h3 className="text-lg font-bold font-outfit mb-6">Distribución de Activos</h3>
          <AssetAllocationChart data={MOCK_ALLOCATION} />
          <div className="mt-4 space-y-3">
            {MOCK_ALLOCATION.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">{item.name}</span>
                <span className="text-zinc-100 font-bold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Positions Section */}
      <div className="glass-card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold font-outfit">Posiciones Principales</h3>
          <button className="text-sm text-blue-400 hover:text-blue-300 font-medium tracking-wide">
            Ver todas
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-zinc-500 uppercase tracking-widest border-b border-white/5">
                <th className="pb-4 font-semibold">Activo</th>
                <th className="pb-4 font-semibold text-right">Invertido</th>
                <th className="pb-4 font-semibold text-right">Valor actual</th>
                <th className="pb-4 font-semibold text-right">Retorno</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AssetRow name="NVIDIA Corp" ticker="NVDA" invested="1.200€" current="1.740€" pnl="+45%" />
              <AssetRow name="Apple Inc" ticker="AAPL" invested="2.500€" current="2.620€" pnl="+4.8%" />
              <AssetRow name="Vanguard S&P 500" ticker="VUSA" invested="5.000€" current="5.400€" pnl="+8.0%" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface AssetRowProps {
  name: string;
  ticker: string;
  invested: string;
  current: string;
  pnl: string;
}

function AssetRow({ name, ticker, invested, current, pnl }: AssetRowProps) {
  return (
    <tr className="group hover:bg-white/[0.02] transition-colors">
      <td className="py-4">
        <div className="font-medium text-zinc-100">{name}</div>
        <div className="text-xs text-zinc-500">{ticker}</div>
      </td>
      <td className="py-4 text-right text-zinc-300">{invested}</td>
      <td className="py-4 text-right text-zinc-100 font-medium">{current}</td>
      <td className="py-4 text-right">
        <span className="bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded-full font-bold">
          {pnl}
        </span>
      </td>
    </tr>
  );
}
