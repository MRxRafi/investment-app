import Link from "next/link";
import { AssetStats } from "@/types";

export function TopPositions({ positions }: { positions: AssetStats[] }) {
  return (
    <div className="glass-card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold font-outfit">Posiciones Principales</h3>
        <Link href="/assets" className="text-sm text-blue-400 hover:text-blue-300 font-medium tracking-wide">
          Ver todas
        </Link>
      </div>
      <div className="overflow-x-auto pb-2">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs text-zinc-500 uppercase tracking-widest border-b border-white/5">
              <th className="pb-4 pt-1 font-semibold pl-1 pr-4">Activo</th>
              <th className="pb-4 pt-1 font-semibold text-right px-4 hidden lg:table-cell">Invertido</th>
              <th className="pb-4 pt-1 font-semibold text-right px-4 hidden sm:table-cell">Valor actual</th>
              <th className="pb-4 pt-1 font-semibold text-right pr-1 pl-4">Retorno</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {positions.map((pos, idx) => (
              <AssetRow 
                key={idx}
                name={pos.name} 
                ticker={pos.ticker} 
                invested={pos.invested.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} 
                current={pos.currentValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} 
                pnl={`${pos.pnlPercent > 0 ? '+' : ''}${pos.pnlPercent.toFixed(1)}%`} 
                isPositive={pos.pnl >= 0}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssetRow({ name, ticker, invested, current, pnl, isPositive }: { 
  name: string; 
  ticker: string; 
  invested: string; 
  current: string; 
  pnl: string; 
  isPositive: boolean;
}) {
  return (
    <tr className="group hover:bg-white/[0.02] transition-colors">
      <td className="py-4 pl-1 pr-4 max-w-[150px] sm:max-w-[200px] lg:max-w-none">
        <div className="font-medium text-zinc-100 group-hover:text-white transition-colors truncate" title={name}>{name}</div>
        <div className="text-xs text-zinc-500 font-mono tracking-tighter uppercase">{ticker}</div>
      </td>
      <td className="py-4 px-4 text-right text-zinc-400 font-mono text-sm hidden lg:table-cell">{invested}</td>
      <td className="py-4 px-4 text-right text-zinc-100 font-bold font-mono text-sm hidden sm:table-cell">{current}</td>
      <td className="py-4 pr-1 pl-4 text-right">
        <span className={`${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'} text-xs px-2.5 py-1 rounded-full font-bold shadow-sm inline-block min-w-[50px] whitespace-nowrap`}>
          {pnl}
        </span>
      </td>
    </tr>
  );
}
