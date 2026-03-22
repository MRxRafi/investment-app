"use client";

import { useEffect, useState, useRef } from 'react';
import { Asset, Transaction } from '@/types';
import { supabase } from '@/lib/supabase';
import { calculateAssetStats, calculateDashboardStats } from '@/lib/finance';
import { PerformanceChart, AssetAllocationChart } from '@/components/Charts';
import { 
  FileText, Download, Printer, Loader2, 
  Calendar, Briefcase, TrendingUp, AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Parallelize initial data fetching
        const [assetsResponse, transactionsResponse] = await Promise.all([
          supabase.from('assets').select('*'),
          supabase.from('transactions').select('*')
        ]);

        const assets = assetsResponse.data;
        const transactions = transactionsResponse.data;
        
        const priceMap: Record<string, number> = {};
        assets?.forEach(a => {
          if (a.ticker) priceMap[a.ticker] = Number(a.current_price || 0);
        });

        const assetStats = calculateAssetStats(assets || [], transactions || [], priceMap);
        
        // Fetch Benchmark History for Chart (IWDA.AS) via API with Timeout
        let perfData: any[] = [];
        try {
          const startDate = new Date('2025-10-06');
          const today = new Date();
          const days = Math.ceil(Math.abs(today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Use AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

          const res = await fetch(`/api/history?ticker=IWDA.AS&days=${days}`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          const benchmarkHistory = await res.json();

          if (Array.isArray(benchmarkHistory) && benchmarkHistory.length > 0) {
            const totalValue = assetStats.reduce((acc, s) => acc + s.currentValue, 0);
            const totalInvested = assetStats.reduce((acc, s) => acc + s.invested, 0);
            const firstPrice = benchmarkHistory[0]?.close || 1;
            const lastPrice = benchmarkHistory[benchmarkHistory.length - 1]?.close || 1;
            const totalGrowth = lastPrice / firstPrice;
            const targetEndValue = totalInvested * totalGrowth;
            const ratio = targetEndValue !== 0 ? totalValue / targetEndValue : 1;

            perfData = benchmarkHistory.map((day: any, index: number) => {
              const dayGrowth = day.close / firstPrice;
              const progress = index / (benchmarkHistory.length - 1);
              const benchmarkValue = totalInvested * dayGrowth;
              const portfolioValue = benchmarkValue * Math.pow(ratio, progress);
              return {
                date: new Date(day.date).toISOString().split('T')[0],
                value: Math.round(portfolioValue),
                benchmark: Math.round(benchmarkValue)
              };
            });
          }
        } catch (e) {
          console.warn('History fetch failed or timed out:', e);
          // provide empty or fallback performance data if needed
        }

        const stats = calculateDashboardStats(assetStats, assets || [], perfData);
        setData({ assets: assets || [], assetStats, stats });
      } catch (e) {
        console.error('Data fetching error:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Listen to native print events (Ctrl+P) so we can sync isPrinting state
  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);
    
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const handlePrint = () => {
    setIsPrinting(true);
    // Use a small timeout to let the UI re-render with isPrinting=true before the print dialog blocks the thread
    setTimeout(() => {
      window.print();
      // setTimeout to false as well, though afterprint should catch it natively in most modern browsers
      setIsPrinting(false);
    }, 150); // increased slightly to give React more time to re-render charts sync
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
            Mis <span className="text-yellow-500">Reportes</span>
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

      {/* Report Content */}      <div 
        ref={reportRef} 
        className="report-content bg-black border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl p-8 md:p-16 print:border-none print:shadow-none print:p-0 print:m-0 print:overflow-visible print:bg-white"
      >
        {(() => {
          const isPrint = typeof window !== 'undefined' && window.matchMedia('print').matches;
          const activeAssets = data.assetStats.filter((s: any) => s.currentValue > 0);
          const mid = Math.ceil(activeAssets.length / 2);
          const leftColumn = activeAssets.slice(0, mid);
          const rightColumn = activeAssets.slice(mid);

          return (
            <div className="print:block print:w-full">
              {/* PAGE 1: Summary and Charts */}
              <div className="space-y-16 print:space-y-8 page-break-container">
                {/* Report Top Branding */}
                <div className="flex justify-between items-start border-b border-white/5 pb-12 print:border-zinc-100">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center font-black text-black text-xs">NB</div>
                      <h2 className="text-2xl font-black font-outfit uppercase tracking-tighter text-white print:text-black">ElPortafolio</h2>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] font-plus-jakarta print:text-zinc-600">Generado el</p>
                    <p className="text-xl font-black font-outfit text-white uppercase italic print:text-black">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                {/* Global Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 print:grid-cols-4 print:gap-4 print:border-b print:border-zinc-100 print:pb-8">
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] font-plus-jakarta italic print:text-[8px]">Net Worth</p>
                    <p className="text-3xl font-black font-outfit text-white leading-none print:text-xl print:text-black">
                      {data.stats.totalValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] font-plus-jakarta italic print:text-[8px]">All-Time P&L</p>
                    <p className={cn(
                      "text-3xl font-black font-outfit leading-none print:text-xl",
                      data.stats.totalPnL >= 0 ? "text-emerald-500 transition-none print:text-black" : "text-red-500 transition-none print:text-black"
                    )}>
                      {data.stats.totalPnL >= 0 ? "+" : ""}{data.stats.totalPnL.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] font-plus-jakarta italic print:text-[8px]">ROI Percent</p>
                    <p className={cn(
                       "text-3xl font-black font-outfit leading-none print:text-xl",
                       data.stats.totalPnLPercent >= 0 ? "text-emerald-500 transition-none print:text-black" : "text-red-500 transition-none print:text-black"
                    )}>
                      {data.stats.totalPnLPercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] font-plus-jakarta italic print:text-[8px]">Available Cash</p>
                    <p className="text-3xl font-black font-outfit text-zinc-300 leading-none print:text-xl print:text-black">
                      {data.stats.liquidity.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>

                {/* Performance Evolution Chart */}
                <div className="space-y-6 print:space-y-2">
                  <div className="flex items-center space-x-4 print:hidden">
                     <div className="h-0.5 flex-1 bg-white/5" />
                     <h3 className="text-xs font-black font-outfit uppercase tracking-[0.3em] text-zinc-500 italic">Portfolio Evolution vs MSCI World</h3>
                     <div className="h-0.5 flex-1 bg-white/5" />
                  </div>
                  <div className="h-[300px] print:h-[220px] print:pr-12">
                    <PerformanceChart 
                      data={data.stats.performanceData} 
                      height={isPrint ? 200 : 300}
                      colors={isPrint ? {
                        backgroundColor: '#ffffff',
                        lineColor: '#000000',
                        textColor: '#000000',
                        areaTopColor: '#e0e0e0', // Slightly darker for clear contrast
                        areaBottomColor: '#ffffff',
                        gridColor: '#dddddd',
                        benchmarkColor: '#444444' // Much darker for B&W distinction
                      } : undefined}
                    />
                  </div>
                </div>

                {/* Allocation Charts - Stacked in print for more space */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 print:grid-cols-1 print:w-full print:gap-12 print:mb-0">
                  <div className="space-y-4 print:space-y-0 text-center flex justify-center">
                    <div className="h-[350px] print:h-[400px] w-full flex justify-center">
                      <AssetAllocationChart data={data.stats.allocation} outerRadius={isPrint || isPrinting ? 80 : 85} isPrinting={isPrinting} />
                    </div>
                  </div>
                  <div className="space-y-4 print:space-y-0 text-center flex justify-center">
                    <div className="h-[350px] print:h-[400px] w-full flex justify-center">
                      <AssetAllocationChart data={data.stats.allAssetAllocation} outerRadius={isPrint || isPrinting ? 80 : 85} isPrinting={isPrinting} />
                    </div>
                  </div>
                </div>
              </div>

              {/* PAGE 2: Assets Breakdown */}
              <div className="space-y-16 print:space-y-0 page-break-before">
                <div className="space-y-8 print:pt-4">
                  <div className="flex items-center space-x-4 print:hidden">
                     <div className="h-0.5 flex-1 bg-white/5" />
                     <h3 className="text-xs font-black font-outfit uppercase tracking-[0.3em] text-zinc-500 italic">Portfolio Matrix Structure</h3>
                     <div className="h-0.5 flex-1 bg-white/5" />
                  </div>

                  <div className="print:grid print:grid-cols-2 print:gap-12 print:mt-12 w-full">
                    {(() => {
                      const renderColumn = (items: any[], isPrintOnly = false) => (
                        <div className={cn(
                          "grid grid-cols-1 gap-y-6",
                          isPrintOnly ? "hidden print:grid print:grid-cols-1" : "grid md:grid-cols-2 gap-x-12 print:hidden w-full"
                        )}>
                          {items.map((s: any) => (
                            <div key={s.ticker} className="flex justify-between items-center border-b border-white/5 pb-4 print:border-zinc-100" style={{ breakInside: 'avoid' }}>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] font-black text-yellow-500 uppercase px-1.5 py-0.5 bg-yellow-500/5 border border-yellow-500/10 rounded print:border-zinc-200 print:text-zinc-700">
                                    {s.ticker}
                                  </span>
                                  <span className="text-sm font-bold text-zinc-100 print:text-black truncate max-w-[150px]">{s.name}</span>
                                </div>
                                <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-none print:text-zinc-500">
                                  {((s.currentValue / data.stats.totalValue) * 100).toFixed(1)}% Allocation
                                </div>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="text-sm font-black font-outfit text-white print:text-black">
                                  {s.currentValue.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
                                </p>
                                <p className={cn(
                                  "text-[10px] font-black uppercase tracking-widest",
                                  s.pnlPercent >= 0 ? "text-emerald-500 print:text-black font-bold" : "text-red-500 print:text-black font-bold"
                                )}>
                                  {s.pnlPercent >= 0 ? "+" : ""}{s.pnlPercent.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      );

                      return (
                        <>
                          {renderColumn(activeAssets)}
                          {renderColumn(leftColumn, true)}
                          {renderColumn(rightColumn, true)}
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row justify-end gap-8 print:border-zinc-100">
                  <div className="flex flex-col items-end space-y-2 opacity-20 print:opacity-100">
                     <div className="w-32 h-1 bg-zinc-800 print:bg-zinc-200" />
                     <div className="w-24 h-1 bg-zinc-800 print:bg-zinc-200" />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
      {/* CSS for print mode */}
      <style jsx global>{`
        @media print {
          /* Force White Background and B&W */
          html, body, #__next, body > div:first-child, .report-content, .bg-black {
            background-color: white !important;
            background: white !important;
            color: black !important;
            filter: grayscale(1) contrast(1.5) !important;
            height: auto !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            display: block !important;
          }

          /* General Layout Resets for Print */
          .section-container, .min-h-screen, main {
            overflow: visible !important;
            display: block !important;
            height: auto !important;
          }

          /* Force Visibility for Charts */
          svg {
            display: block !important;
            margin: 0 auto !important;
          }

          canvas {
            display: block !important;
            max-width: 100% !important;
            margin: 0 auto !important;
          }

          /* Page Break Controls - Simplified to avoid double breaks in Firefox */
          .page-break-container {
            display: block !important;
            width: 100% !important;
            clear: both !important;
          }

          .page-break-before {
            display: block !important;
            page-break-before: always !important;
            break-before: page !important;
            padding-top: 1cm !important;
            width: 100% !important;
            clear: both !important;
          }

          /* High Contrast B&W Text */
          p, h1, h2, h3, span, div, strong, text, .text-zinc-500, .text-zinc-600, .text-zinc-400 {
             color: black !important;
          }
          
          .text-zinc-500, .text-zinc-600, .text-zinc-400 {
             font-weight: 500 !important;
          }

          .text-yellow-500, .text-emerald-500, .text-red-500 {
             color: black !important;
             font-weight: 900 !important;
          }

          /* Charts Container and Alignment */
          .recharts-responsive-container {
            width: 100% !important;
            height: 300px !important;
          }

          .recharts-surface {
            overflow: visible !important;
          }
          
          /* Evitar cortes a mitad de elemento */
          .border-b {
            break-inside: avoid !important;
            border-bottom-color: #000000 !important;
            border-bottom-width: 1px !important;
          }

          /* Browser-specific fixes */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
