"use client";

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Asset {
  id: string;
  name: string;
  ticker: string;
  asset_type: string;
}

interface Transaction {
  asset_id: string;
  transaction_type: string;
  quantity: number;
  price_per_unit: number;
  fee: number;
}

interface AssetStats {
  id: string;
  name: string;
  ticker: string;
  weight: number;
  value: number;
  return: number;
}

export default function AssetsPage() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<AssetStats[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: assetsData, error: assetsError } = await supabase.from('assets').select('*');
        const { data: txData, error: txError } = await supabase.from('transactions').select('*');

        if (assetsError || txError) throw assetsError || txError;

        const rawAssets = assetsData as Asset[];
        const transactions = txData as Transaction[];

        const stats: AssetStats[] = await Promise.all(rawAssets.map(async (asset) => {
          const assetTx = transactions.filter(t => t.asset_id === asset.id);
          
          let qty = 0;
          let invested = 0;
          
          assetTx.forEach(t => {
            const q = Number(t.quantity);
            const p = Number(t.price_per_unit);
            const f = Number(t.fee || 0);
            
            if (t.transaction_type === 'Buy') {
              qty += q;
              invested += (q * p) + f;
            } else if (t.transaction_type === 'Sell') {
              qty -= q;
              invested -= (q * p) - f;
            }
          });

          let currentPrice = 0;
          if (asset.ticker && asset.ticker !== '---') {
            try {
              const res = await fetch(`/api/price?ticker=${asset.ticker}`);
              const data = await res.json();
              if (data && typeof data.price === 'number') {
                currentPrice = data.price;
              }
            } catch (e) {
              console.warn(`Price fetch failed for ${asset.ticker}`, e);
            }
          }

          const currentValue = qty * currentPrice;
          const pnlPercent = invested !== 0 ? ((currentValue - invested) / invested) * 100 : 0;

          return {
            id: asset.id,
            name: asset.name,
            ticker: asset.ticker || '---',
            weight: 0, // Will calculate after all values are known
            value: currentValue,
            return: pnlPercent
          };
        }));

        const totalValue = stats.reduce((acc, s) => acc + s.value, 0);
        const finalAssets = stats
          .map(s => ({
            ...s,
            weight: totalValue > 0 ? Number(((s.value / totalValue) * 100).toFixed(1)) : 0
          }))
          .filter(s => s.value > 0.01 || s.value < -0.01) // Show only active or significantly non-zero positions
          .sort((a, b) => b.value - a.value);

        setAssets(finalAssets);
      } catch (error) {
        console.error('Error fetching assets data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-zinc-500 animate-pulse">Cargando tus activos...</p>
      </div>
    );
  }

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
                      <div className="w-12 h-12 rounded-xl bg-zinc-800/80 flex items-center justify-center font-bold text-xs border border-white/10 shadow-inner overflow-hidden text-center px-1">
                        {asset.ticker}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-100">{asset.name}</p>
                        <p className="text-sm text-zinc-500">{asset.ticker}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-right font-medium text-zinc-300">
                    {asset.weight}%
                  </td>
                  <td className="p-6 text-right font-bold font-outfit text-lg text-zinc-100">
                    {asset.value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </td>
                  <td className="p-6 text-right">
                    <div className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${asset.return > 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : asset.return < 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'}`}>
                      {asset.return > 0 && <TrendingUp className="w-3.5 h-3.5" />}
                      {asset.return < 0 && <TrendingDown className="w-3.5 h-3.5" />}
                      {asset.return === 0 && <span className="w-3.5 h-3.5 text-center leading-none">-</span>}
                      <span>{Math.abs(asset.return).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-zinc-500">
                    No tienes activos con posiciones abiertas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
