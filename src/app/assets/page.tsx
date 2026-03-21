"use client";

import { TrendingUp, TrendingDown } from 'lucide-react';

export default function AssetsPage() {
  const assets = [
    { id: 1, name: 'NVIDIA Corp', ticker: 'NVDA', weight: 35, value: 19334, return: 45.0 },
    { id: 2, name: 'Apple Inc', ticker: 'AAPL', weight: 15, value: 8286, return: 4.8 },
    { id: 3, name: 'Vanguard S&P 500', ticker: 'VUSA', weight: 45, value: 24858, return: 8.0 },
    { id: 4, name: 'Efectivo', ticker: 'EUR', weight: 5, value: 2762.42, return: 0.0 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-outfit mb-2 title-gradient">Tus Activos</h1>
          <p className="text-zinc-400">Distribución actual de tu cartera de inversiones.</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden !p-0 shadow-2xl">
        <div className="bg-zinc-900/50 p-6 border-b border-white/5">
          <h3 className="text-lg font-bold font-outfit">Posiciones Actuales</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-zinc-500 uppercase tracking-widest border-b border-white/5">
                <th className="p-6 font-medium">Activo</th>
                <th className="p-6 font-medium text-right">Peso</th>
                <th className="p-6 font-medium text-right">Valor (€)</th>
                <th className="p-6 font-medium text-right">Retorno (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-zinc-800/80 flex items-center justify-center font-bold text-sm border border-white/10 shadow-inner">
                        {asset.ticker}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-100">{asset.name}</p>
                        <p className="text-sm text-zinc-500">{asset.ticker}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-right font-medium">
                    {asset.weight}%
                  </td>
                  <td className="p-6 text-right font-bold font-outfit text-lg">
                    {asset.value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </td>
                  <td className="p-6 text-right">
                    <div className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${asset.return > 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : asset.return < 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'}`}>
                      {asset.return > 0 && <TrendingUp className="w-3.5 h-3.5" />}
                      {asset.return < 0 && <TrendingDown className="w-3.5 h-3.5" />}
                      {asset.return === 0 && <span className="w-3.5 h-3.5 text-center leading-none">-</span>}
                      <span>{Math.abs(asset.return)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
