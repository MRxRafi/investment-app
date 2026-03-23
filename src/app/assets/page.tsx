"use client";

import { useEffect, useState, useCallback } from 'react';
import { Asset, Transaction } from '@/types';
import { AddAssetForm } from '@/components/assets/AddAssetForm';
import { TrendingUp, TrendingDown, Loader2, Plus, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { getPrice } from '@/lib/yahoo';

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
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: assetsData, error: assetsError } = await supabase.from('assets').select('*');
      const { data: txData, error: txError } = await supabase.from('transactions').select('*');

      if (assetsError || txError) throw assetsError || txError;

      const rawAssets = assetsData as Asset[];
      const transactions = txData as any[];

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
            const data = await getPrice(asset.ticker);
            if (data && typeof data.price === 'number') {
              currentPrice = data.price;
            }
          } catch (e) {
            console.warn(`Price fetch failed for ${asset.ticker}`);
          }
        }

        const currentValue = qty * currentPrice;
        const pnlPercent = invested !== 0 ? ((currentValue - invested) / invested) * 100 : 0;

        return {
          id: asset.id,
          name: asset.name,
          ticker: asset.ticker || '---',
          weight: 0, 
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
        .filter(s => s.value > 0.01 || s.value < -0.01) 
        .sort((a, b) => b.value - a.value);

      setAssets(finalAssets);
    } catch (error) {
      console.error('Error fetching assets data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssetAdded = () => {
    setShowAddForm(false);
    fetchData();
  };

  if (loading) {
    return (
      <div className="section-container flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
        <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest animate-pulse">Scanning Matrix...</p>
      </div>
    );
  }

  return (
    <div className="section-container space-y-10 py-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black font-outfit tracking-tighter text-white uppercase italic">
            Mis <span className="text-yellow-500">Activos</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium font-plus-jakarta tracking-wide">
            Distribución estratégica y métricas individuales de rendimiento.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full sm:w-auto px-8 py-4 bg-yellow-500 text-black font-black font-outfit text-sm uppercase tracking-wider rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center space-x-3 shadow-[0_0_30px_rgba(250,204,21,0.2)] border-2 border-black/10 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Añadir Activo</span>
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500" />
            <AddAssetForm 
              onAssetAdded={handleAssetAdded} 
              onCancel={() => setShowAddForm(false)} 
            />
          </div>
        </div>
      )}

      <div className="glass-card !p-0 overflow-hidden border-white/10 shadow-2xl">
        <div className="bg-white/[0.02] px-8 py-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-black font-outfit uppercase tracking-[0.2em] text-zinc-400 italic">Posiciones Activas</h3>
          <span className="text-[10px] font-bold text-zinc-600 bg-white/5 px-2 py-1 rounded uppercase tracking-widest">{assets.length} Unidades</span>
        </div>
        
        {/* Mobile View: Card List */}
        <div className="lg:hidden divide-y divide-white/5">
          {assets.map((asset) => (
            <div key={asset.id} className="p-6 space-y-4 hover:bg-white/[0.01] transition-colors relative group">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center font-black text-[10px] border border-white/10 text-zinc-400 shadow-inner">
                    {asset.ticker}
                  </div>
                  <div>
                    <h4 className="font-black font-outfit text-white tracking-tight uppercase leading-none mb-1">{asset.name}</h4>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest font-plus-jakarta">{asset.ticker}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1">Peso</p>
                  <p className="text-sm font-black font-outfit text-yellow-500">{asset.weight}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Valorización</p>
                  <p className="text-lg font-black font-outfit text-white">
                    {asset.value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Retorno</p>
                  <div className={cn(
                    "inline-flex items-center font-black font-outfit text-sm",
                    asset.return > 0 ? "text-emerald-500" : asset.return < 0 ? "text-red-500" : "text-zinc-500"
                  )}>
                    {asset.return > 0 ? "+" : ""}{asset.return.toFixed(1)}%
                    <ArrowUpRight className={cn("w-3 h-3 ml-1", asset.return <= 0 && "rotate-90")} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] border-b border-white/5 font-plus-jakarta">
                <th className="px-8 py-6">Activo / Instrumento</th>
                <th className="px-8 py-6 text-right">Peso</th>
                <th className="px-8 py-6 text-right">Valorización Total</th>
                <th className="px-8 py-6 text-right">P&L Histórico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-white/[0.02] transition-all group cursor-default">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-5">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center font-black text-[11px] border border-white/5 text-zinc-500 shadow-inner group-hover:border-yellow-500/30 transition-colors">
                        {asset.ticker}
                      </div>
                      <div>
                        <p className="font-black font-outfit text-zinc-100 uppercase tracking-tight text-lg leading-none mb-1 group-hover:text-yellow-500 transition-colors">
                          {asset.name}
                        </p>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.15em] font-plus-jakarta italic">{asset.ticker}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="text-sm font-black font-outfit text-zinc-400 hover:text-yellow-500 transition-colors">
                      {asset.weight}%
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="text-xl font-black font-outfit text-white leading-none">
                      {asset.value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<span className="text-zinc-500 ml-1">€</span>
                    </p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className={cn(
                      "inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black font-outfit uppercase tracking-wider border transition-all",
                      asset.return > 0 
                        ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/10" 
                        : asset.return < 0 
                          ? "bg-red-500/5 text-red-400 border-red-500/20 group-hover:bg-red-500/10" 
                          : "bg-zinc-800/10 text-zinc-500 border-white/5"
                    )}>
                      {asset.return > 0 && <TrendingUp className="w-3 h-3" />}
                      {asset.return < 0 && <TrendingDown className="w-3 h-3" />}
                      <span>{Math.abs(asset.return).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <p className="text-zinc-600 font-bold text-sm uppercase tracking-widest font-plus-jakarta animate-pulse">No active positions detected in Sector 7.</p>
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
