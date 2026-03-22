"use client";

import { useEffect, useState, useRef } from 'react';
import { Asset, Transaction } from '@/types';
import { supabase } from '@/lib/supabase';
import { calculateAssetStats, calculateDashboardStats } from '@/lib/finance';
import { 
  FileText, Download, Printer, Loader2, 
  Calendar, Briefcase, TrendingUp, AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: assets } = await supabase.from('assets').select('*');
        const { data: transactions } = await supabase.from('transactions').select('*');
        
        // Use prices from assets or defaults
        const priceMap: Record<string, number> = {};
        assets?.forEach(a => {
          if (a.ticker) priceMap[a.ticker] = Number(a.current_price || 0);
        });

        const assetStats = calculateAssetStats(assets || [], transactions || [], priceMap);
        const stats = calculateDashboardStats(assetStats, assets || [], []);
        
        setData({ assets: assets || [], assetStats, stats });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
     return (
        <div className="section-container flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest animate-pulse font-plus-jakarta">Generating Intelligence...</p>
        </div>
      );
  }

  return (
    <div className="section-container space-y-10 py-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 print:hidden">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black font-outfit tracking-tighter text-white uppercase italic">
            Intelligence <span className="text-yellow-500">Reports</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium font-plus-jakarta tracking-wide">
            Generación de informes de rendimiento y estados financieros.
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button 
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-6 py-3 bg-zinc-900 border border-white/5 text-white font-black font-outfit text-xs uppercase tracking-widest rounded-xl hover:bg-white/[0.05] transition-all flex items-center justify-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
          <button className="flex-1 sm:flex-none px-6 py-3 bg-yellow-500 text-black font-black font-outfit text-xs uppercase tracking-widest rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
            <Download className="w-4 h-4" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div 
        ref={reportRef} 
        className="bg-black border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl p-8 md:p-16 space-y-16 print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Report Top Branding */}
        <div className="flex justify-between items-start border-b border-white/5 pb-12">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center font-black text-black text-xs">NB</div>
              <h2 className="text-2xl font-black font-outfit uppercase tracking-tighter text-white">ElPortafolio</h2>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.25em] font-plus-jakarta italic">Investment Strategy Intelligence</p>
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.25em] font-plus-jakarta">Protocol v2.0 • Authorized Personnel Only</p>
            </div>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] font-plus-jakarta">Generado el</p>
            <p className="text-xl font-black font-outfit text-white uppercase italic">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Global Stats Grid for Print */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] font-plus-jakarta italic">Net Worth</p>
            <p className="text-3xl font-black font-outfit text-white leading-none">
              {data.stats.totalValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] font-plus-jakarta italic">All-Time P&L</p>
            <p className={cn(
              "text-3xl font-black font-outfit leading-none",
              data.stats.totalPnL >= 0 ? "text-emerald-500" : "text-red-500"
            )}>
              {data.stats.totalPnL >= 0 ? "+" : ""}{data.stats.totalPnL.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] font-plus-jakarta italic">ROI Percent</p>
            <p className={cn(
               "text-3xl font-black font-outfit leading-none",
               data.stats.totalPnLPercent >= 0 ? "text-emerald-500" : "text-red-500"
            )}>
              {data.stats.totalPnLPercent.toFixed(1)}%
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] font-plus-jakarta italic">Available Cash</p>
            <p className="text-3xl font-black font-outfit text-zinc-300 leading-none">
              {data.stats.liquidity.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Assets Breakdown Table for Print */}
        <div className="space-y-8">
          <div className="flex items-center space-x-4">
             <div className="h-0.5 flex-1 bg-white/5" />
             <h3 className="text-xs font-black font-outfit uppercase tracking-[0.3em] text-zinc-500 italic">Portfolio Matrix Structure</h3>
             <div className="h-0.5 flex-1 bg-white/5" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] border-b border-white/5 font-plus-jakarta">
                  <th className="py-4">Ticker</th>
                  <th className="py-4">Asset Name</th>
                  <th className="py-4 text-right">Allocation</th>
                  <th className="py-4 text-right">Value (€)</th>
                  <th className="py-4 text-right">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.assetStats.map((s: any) => (
                  <tr key={s.id} className="text-sm font-plus-jakarta">
                    <td className="py-5 font-black text-yellow-500/80 uppercase">{s.ticker}</td>
                    <td className="py-5 font-bold text-zinc-100">{s.name}</td>
                    <td className="py-5 text-right font-black text-zinc-500">
                      {((s.currentValue / data.stats.totalValue) * 100).toFixed(1)}%
                    </td>
                    <td className="py-5 text-right font-black text-white italic">
                      {s.currentValue.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                    <td className={cn(
                      "py-5 text-right font-black",
                      s.pnlPercent >= 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {s.pnlPercent >= 0 ? "+" : ""}{s.pnlPercent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disclosure / Footer Info */}
        <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-md space-y-4">
            <div className="flex items-center space-x-2 text-yellow-500/50">
              <AlertCircle className="w-3 h-3" />
              <p className="text-[10px] font-black uppercase tracking-widest">Risk Disclosure</p>
            </div>
            <p className="text-[10px] text-zinc-600 font-medium leading-relaxed font-plus-jakarta">
              Este informe ha sido generado automáticamente por el motor de análisis de ElPortafolio Engine v2.0. Los datos reflejan el estado de la cartera basado en los precios de mercado actuales obtenidos via red Yahoo Finance y las transacciones registradas localmente. El rendimiento pasado no garantiza resultados futuros.
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2 opacity-20">
             <div className="w-32 h-1 bg-zinc-800" />
             <div className="w-24 h-1 bg-zinc-800" />
             <p className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.25em]">Digital Signature Encrypted</p>
          </div>
        </div>
      </div>
    </div>
  );
}
