"use client";

import { useEffect, useState, useRef } from 'react';
import { Asset, Transaction } from '@/types';
import { supabase } from '@/lib/supabase';
import { calculateAssetStats, calculateDashboardStats } from '@/lib/finance';
import { PerformanceChart, AssetAllocationChart } from '@/components/Charts';
import { 
  FileText, Download, Loader2, 
  Calendar, Briefcase, TrendingUp, AlertCircle,
  Save, History, ArrowLeft, CheckCircle2, Trash2
} from 'lucide-react';
import { getPrice, getHistory } from '@/lib/yahoo';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as htmlToImage from 'html-to-image';
import { useCategoryColors } from '@/hooks/useCategoryColors';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { colors: categoryColors } = useCategoryColors();

  const fetchReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select('id, created_at, report_date, total_value')
      .order('created_at', { ascending: false });
    if (data) setReports(data);
  };

  const fetchData = async (reportId: string | null = null) => {
    try {
      setLoading(true);
      
      if (reportId) {
        const { data: report, error } = await supabase
          .from('reports')
          .select('*')
          .eq('id', reportId)
          .single();
        
        if (error) throw error;
        
        // Hotfix for historical reports saved with the old naming convention
        const patchedAssetStats = (report.asset_stats || []).map((s: any) => {
           if (s.ticker === 'DEBT' || s.name === 'Debt' || s.category === 'Debt') {
              return { ...s, currentValue: s.invested, currentPrice: 1.0 };
           }
           return s;
        });

        const patchedAllPositions = (report.stats?.allPositions || []).map((s: any) => {
           if (s.ticker === 'DEBT' || s.name === 'Debt' || s.category === 'Debt') {
              return { ...s, currentValue: s.invested, currentPrice: 1.0 };
           }
           return s;
        });

        const mappedStats = report.stats ? {
          totalValue: report.stats.totalValue ?? report.stats.total_value ?? 0,
          totalPnL: report.stats.totalPnL ?? report.stats.total_pnl ?? 0,
          totalPnLPercent: report.stats.totalPnLPercent ?? report.stats.total_pnl_percent ?? report.stats.roi_pct ?? 0,
          capitalInicial: report.stats.capitalInicial ?? report.stats.capital_inicial ?? report.stats.cash ?? 0,
          allocation: report.stats.allocation || [],
          assetAllocation: report.stats.assetAllocation || [],
          topPositions: report.stats.topPositions || [],
          allPositions: patchedAllPositions || report.stats.allPositions || [],
          performanceData: report.performance_data || report.stats.performanceData || []
        } : null;

        setData({
          assets: [],
          assetStats: patchedAssetStats.filter((s: any) => Math.abs(s.currentValue) > 0.01),
          stats: mappedStats,
          isHistorical: true,
          reportDate: report.report_date
        });
        return;
      }

      // Live Data Fetching
      const [assetsResponse, transactionsResponse] = await Promise.all([
        supabase.from('assets').select('*'),
        supabase.from('transactions').select('*')
      ]);

      const assets = assetsResponse.data || [];
      const transactions = transactionsResponse.data || [];
      
      const priceMap: Record<string, number> = {};
      
      // Fetch fresh prices in parallel
      const tickers = Array.from(new Set(assets.map((a: any) => a.ticker).filter((t: any) => t && t !== '---')));
      await Promise.all((tickers as string[]).map(async (ticker) => {
        try {
          const priceData = await getPrice(ticker);
          if (priceData && typeof priceData.price === 'number') {
            priceMap[ticker] = priceData.price;
          }
        } catch (e) {
          console.warn(`Price fetch failed for ${ticker} in ReportsPage`);
        }
      }));

      // Map DB response to standardized interfaces before calculation
      const mappedAssets: Asset[] = assets.map((a: any) => ({
        id: a.id,
        name: a.name,
        ticker: a.ticker,
        currentPrice: priceMap[a.ticker] || Number(a.current_price || 0),
        category: a.category
      }));

      const mappedTransactions: Transaction[] = transactions.map((t: any) => ({
        id: t.id,
        assetId: t.asset_id,
        type: t.type,
        quantity: Number(t.quantity),
        pricePerUnit: Number(t.price_per_unit),
        fee: Number(t.fee || 0),
        date: t.date
      }));

      const assetStats = calculateAssetStats(mappedAssets, mappedTransactions, priceMap);
      
      let perfData: any[] = [];
      try {
        const startDate = new Date('2025-10-06');
        const today = new Date();
        const days = Math.ceil(Math.abs(today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const benchmarkHistory = await getHistory('IWDA.AS', startDate, today);

        if (Array.isArray(benchmarkHistory) && benchmarkHistory.length > 0) {
          const activeStatsForChart = assetStats.filter((s: any) => s.ticker !== 'CAPITAL');
          const totalValue = activeStatsForChart.reduce((acc, s) => acc + s.currentValue, 0);
          const totalInvested = activeStatsForChart.reduce((acc, s) => acc + s.invested, 0);
          const firstPrice = benchmarkHistory[0]?.close || 1;
          const lastPrice = benchmarkHistory[benchmarkHistory.length - 1]?.close || 1;
          const totalGrowth = lastPrice / firstPrice;
          const targetEndValue = totalInvested * totalGrowth;
          const ratio = targetEndValue !== 0 ? totalValue / targetEndValue : 1;

          perfData = benchmarkHistory.map((day: any, index: number) => {
            const dayGrowth = (day.adjClose || day.close) / firstPrice;
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
      }

      const stats = calculateDashboardStats(assetStats, mappedAssets, perfData);
      setData({ 
        assets: mappedAssets, 
        assetStats: assetStats.filter((s: any) => Math.abs(s.currentValue) > 0.01), 
        stats, 
        isHistorical: false 
      });
    } catch (e) {
      console.error('Data fetching error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedReportId);
    fetchReports();
  }, [selectedReportId]);

  const handleSaveReport = async () => {
    if (!data || data.isHistorical) return;
    
    try {
      setSaving(true);
      const { error } = await supabase.from('reports').insert({
        total_value: data.stats.totalValue,
        total_pnl: data.stats.totalPnL,
        roi_pct: data.stats.totalPnLPercent,
        cash: data.stats.capitalInicial ?? data.stats.liquidity ?? 0,
        asset_stats: data.assetStats,
        performance_data: data.stats.performanceData,
        stats: data.stats
      });

      if (error) throw error;
      
      await fetchReports();
      alert('Reporte guardado correctamente');
    } catch (e) {
      console.error('Error saving report:', e);
      alert('Error al guardar el reporte');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReport = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent loading the report when clicking delete
    
    if (!confirm('¿Estás seguro de que deseas eliminar este reporte?')) return;

    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      if (selectedReportId === id) {
        setSelectedReportId(null);
      }
      
      await fetchReports();
    } catch (e) {
      console.error('Error deleting report:', e);
      alert('Error al eliminar el reporte');
    }
  };



  const handleExportPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      if (!reportRef.current) return;

      const pdf = new jsPDF('p', 'mm', 'a4', true);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);

      // Force Print Mode
      setIsPrinting(true);
      await new Promise(resolve => setTimeout(resolve, 400));

      // Backup styles
      const styleTags = Array.from(document.querySelectorAll('style'));
      const originalStyles = styleTags.map(s => s.textContent);
      styleTags.forEach(s => {
        if (s.textContent?.includes('@media print')) {
           s.textContent = s.textContent.replace(/@media print/g, '@media all');
        }
      });

      const sections = ['pdf-section-1', 'pdf-section-2'];
      
      for (let i = 0; i < sections.length; i++) {
        const sectionId = sections[i];
        const element = document.getElementById(sectionId);
        if (!element) continue;

        if (i > 0) pdf.addPage();

        // Swap canvases
        const canvases = Array.from(element.querySelectorAll('canvas'));
        const replacements: { canvas: HTMLCanvasElement; img: HTMLImageElement; parent: HTMLElement }[] = [];

        canvases.forEach(canvas => {
          const parent = canvas.parentElement;
          if (parent) {
            const img = document.createElement('img');
            img.src = canvas.toDataURL('image/jpeg', 1.0);
            img.style.width = canvas.style.width || canvas.offsetWidth + 'px';
            img.style.height = canvas.style.height || canvas.offsetHeight + 'px';
            img.style.display = 'block';
            img.className = canvas.className;
            parent.replaceChild(img, canvas);
            replacements.push({ canvas, img, parent });
          }
        });

        await new Promise(resolve => setTimeout(resolve, 100));

        const dataUrl = await htmlToImage.toJpeg(element, {
          quality: 1.0,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          skipFonts: true,
          width: element.scrollWidth,
          height: element.scrollHeight,
          style: { transform: 'none', margin: '0' }
        });

        // Restore canvases for this section
        replacements.forEach(r => {
          if (r.parent.contains(r.img)) r.parent.replaceChild(r.canvas, r.img);
        });

        const imgProps = pdf.getImageProperties(dataUrl);
        const imgHeight = (imgProps.height * contentWidth) / imgProps.width;
        
        // Add to page
        pdf.addImage(dataUrl, 'JPEG', margin, margin, contentWidth, imgHeight, undefined, 'FAST');
      }

      // Restore styles and state
      styleTags.forEach((s, i) => { s.textContent = originalStyles[i]; });
      setIsPrinting(false);

      pdf.save(`Reporte_Inversiones_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export failed:', error);
      alert('Error al generar el PDF.');
    } finally {
      setIsGeneratingPDF(false);
    }
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
          {data?.isHistorical ? (
            <button 
              onClick={() => setSelectedReportId(null)}
              className="flex-1 sm:flex-none px-6 py-3 bg-zinc-900 border border-white/5 text-white font-black font-outfit text-xs uppercase tracking-widest rounded-xl hover:bg-white/[0.05] transition-all flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Vivo</span>
            </button>
          ) : (
            <>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="flex-1 sm:flex-none px-6 py-3 bg-zinc-900 border border-white/5 text-white font-black font-outfit text-xs uppercase tracking-widest rounded-xl hover:bg-white/[0.05] transition-all flex items-center justify-center space-x-2"
              >
                <History className="w-4 h-4" />
                <span>Historial</span>
              </button>
              <button 
                onClick={handleSaveReport}
                disabled={saving}
                className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 text-white font-black font-outfit text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-500 transition-all flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Guardar Reporte</span>
              </button>
            </>
          )}

          <button 
            onClick={handleExportPDF}
            disabled={isGeneratingPDF}
            className="flex-1 sm:flex-none px-6 py-3 bg-yellow-500 text-black font-black font-outfit text-xs uppercase tracking-widest rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(250,204,21,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isGeneratingPDF ? 'Generando...' : 'Exportar PDF'}</span>
          </button>
        </div>
      </div>

      {/* Reports History Overlay/Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
           <div className="relative w-full max-w-md bg-zinc-950 border-l border-white/10 h-full p-8 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-black font-outfit uppercase italic text-white flex items-center gap-3">
                   <History className="w-6 h-6 text-yellow-500" />
                   Historial <span className="text-yellow-500">Reportes</span>
                 </h2>
                 <button onClick={() => setShowHistory(false)} className="text-zinc-500 hover:text-white transition-colors">
                    <AlertCircle className="w-6 h-6 rotate-45" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {reports.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">No hay reportes guardados</p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <div
                      key={report.id}
                      className={cn(
                        "w-full rounded-2xl border transition-all flex justify-between items-center group overflow-hidden",
                        selectedReportId === report.id 
                          ? "bg-yellow-500 border-yellow-500 text-black" 
                          : "bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10 text-white"
                      )}
                    >
                      <div 
                         onClick={() => {
                           setSelectedReportId(report.id);
                           setShowHistory(false);
                         }}
                         className="flex-1 p-5 cursor-pointer space-y-1"
                      >
                        <p className={cn(
                          "text-xs font-black uppercase tracking-tighter",
                          selectedReportId === report.id ? "text-black/60" : "text-zinc-500"
                        )}>
                          {new Date(report.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-lg font-black font-outfit">
                          {report.total_value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pr-4">
                        <CheckCircle2 className={cn(
                          "w-5 h-5 transition-opacity",
                          selectedReportId === report.id ? "opacity-100" : "opacity-0 group-hover:opacity-20"
                        )} />
                        <button
                          onClick={(e) => handleDeleteReport(e, report.id)}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            selectedReportId === report.id
                              ? "text-black/40 hover:text-black hover:bg-black/10"
                              : "text-zinc-500 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
                          )}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
           </div>
        </div>
      )}

      {/* Report Content */}      <div 
        ref={reportRef} 
        className="report-content bg-black border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl p-8 md:p-16 print:border-none print:shadow-none print:p-0 print:m-0 print:overflow-visible print:bg-white"
      >
        {!data ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
             <AlertCircle className="w-12 h-12 text-zinc-700" />
             <p className="text-zinc-600 font-bold uppercase text-[10px] tracking-widest">No hay datos disponibles para este reporte</p>
          </div>
        ) : (() => {
          const isPrint = typeof window !== 'undefined' && window.matchMedia('print').matches;
          const activeAssets = (data.stats?.allPositions || data.assetStats.filter((s: any) => Math.abs(s.currentValue) > 0.01)).sort((a: any, b: any) => b.currentValue - a.currentValue);
          const mid = Math.ceil(activeAssets.length / 2);
          const leftColumn = activeAssets.slice(0, mid);
          const rightColumn = activeAssets.slice(mid);

          return (
            <div className="print:block print:w-full">
              {/* PAGE 1: Summary and Charts */}
              <div id="pdf-section-1" className="space-y-16 print:space-y-0 page-break-container">
                {/* Report Top Branding */}
                <div className="flex justify-between items-start border-b border-white/5 pb-12 print:pb-2 print:mb-4 print:border-zinc-100">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center font-black text-black text-xs">NB</div>
                      <h2 className="text-2xl font-black font-outfit uppercase tracking-tighter text-white print:text-black print:font-medium">ElPortafolio</h2>
                    </div>
                    {data.isHistorical && (
                      <div className="inline-flex items-center px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full print:hidden">
                        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Reporte Histórico</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] font-plus-jakarta print:text-zinc-600 print:font-medium">
                      {data.isHistorical ? 'Datos capturados el' : 'Generado el'}
                    </p>
                    <p className="text-xl font-black font-outfit text-white uppercase italic print:text-black print:font-normal">
                      {new Date(data.isHistorical ? data.reportDate : new Date()).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Global Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 print:grid-cols-4 print:gap-4 print:border-b print:border-zinc-100 print:pb-8">
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] font-plus-jakarta italic print:text-[12px] print:!font-bold print:!text-black print:not-italic">Net Worth</p>
                    <p className="text-3xl font-black font-outfit text-white leading-none print:text-2xl print:!text-zinc-800 print:!font-light print:font-sans">
                      {data.stats.totalValue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] font-plus-jakarta italic print:text-[12px] print:!font-bold print:!text-black print:not-italic">All-Time P&L</p>
                    <p className={cn(
                      "text-3xl font-black font-outfit leading-none print:text-2xl print:!font-light print:!text-zinc-800 print:font-sans",
                      data.stats.totalPnL >= 0 ? "text-emerald-500 transition-none" : "text-red-500 transition-none"
                    )}>
                      {data.stats.totalPnL >= 0 ? "+" : ""}{data.stats.totalPnL.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] font-plus-jakarta italic print:text-[12px] print:!font-bold print:!text-black print:not-italic">ROI Percent</p>
                    <p className={cn(
                       "text-3xl font-black font-outfit leading-none print:text-2xl print:!font-light print:!text-zinc-800 print:font-sans",
                       data.stats.totalPnLPercent >= 0 ? "text-emerald-500 transition-none" : "text-red-500 transition-none"
                    )}>
                      {data.stats.totalPnLPercent.toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] font-plus-jakarta italic print:text-[12px] print:!font-bold print:!text-black print:not-italic">Capital Inicial</p>
                    <p className="text-3xl font-black font-outfit text-zinc-300 leading-none print:text-2xl print:!text-zinc-800 print:!font-light print:font-sans">
                      {(data.stats.capitalInicial ?? data.stats.liquidity ?? 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>

                {/* Performance Evolution Chart */}
                <div className="space-y-6 print:space-y-2">
                  <div className="flex items-center space-x-4">
                     <div className="h-0.5 flex-1 bg-white/5 print:bg-zinc-100" />
                     <h3 className="text-xs font-black font-outfit uppercase tracking-[0.3em] text-zinc-500 italic print:text-black print:font-medium print:not-italic">Portfolio Evolution vs MSCI World</h3>
                     <div className="h-0.5 flex-1 bg-white/5 print:bg-zinc-100" />
                  </div>
                  <div className="h-[300px] print:h-[240px] print:w-full flex justify-center print:px-6 print:overflow-visible">
                    <PerformanceChart 
                      data={data.stats.performanceData} 
                      height={(isPrint || isPrinting) ? 180 : 300}
                      colors={(isPrint || isPrinting) ? {
                        backgroundColor: '#ffffff',
                        lineColor: '#000000',
                        textColor: '#000000',
                        areaTopColor: '#f8f8f8',
                        areaBottomColor: '#ffffff',
                        gridColor: '#f0f0f0',
                        benchmarkColor: '#999999'
                      } : undefined}
                    />
                  </div>
                </div>

                {/* Allocation Charts - Stacked in print for more space */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 print:grid-cols-1 print:w-full print:gap-0 print:mb-0 print:-mt-28">
                    <div className="h-[350px] print:h-[250px] w-full flex justify-center">
                      <AssetAllocationChart data={data.stats.allocation} isPrinting={isPrinting} categoryColors={categoryColors} />
                    </div>
                  <div className="space-y-4 print:space-y-0 text-center flex justify-center print:mt-4">
                    <div className="h-[350px] print:h-[250px] w-full flex justify-center">
                      <AssetAllocationChart data={data.stats.allAssetAllocation} isPrinting={isPrinting} categoryColors={categoryColors} />
                    </div>
                  </div>
                </div>
              </div>

              {/* PAGE 2: Assets Breakdown */}
              <div id="pdf-section-2" className="space-y-16 print:space-y-0 page-break-before">
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
                                  <span className="text-sm font-bold text-zinc-100 print:text-xs print:text-black print:font-medium truncate max-w-[150px]">{s.name}</span>
                                </div>
                                <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-none print:text-[8px] print:text-zinc-500 print:font-normal">
                                  {((s.currentValue / data.stats.totalValue) * 100).toFixed(1)}% Allocation
                                </div>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="text-sm font-black font-outfit text-white print:text-xs print:text-black print:font-medium">
                                  {s.currentValue.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
                                </p>
                                <p className={cn(
                                  "text-[10px] font-black uppercase tracking-widest",
                                  s.pnlPercent >= 0 ? "text-emerald-500" : "text-red-500",
                                  "print:!text-black print:!font-normal"
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
            filter: grayscale(1) !important;
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
            height: 400px !important;
            margin: 0 auto !important;
            text-align: center !important;
          }

          .recharts-wrapper {
            margin: 0 auto !important;
            display: inline-block !important;
            float: none !important;
          }

          .recharts-surface {
            overflow: visible !important;
            margin: 0 auto !important;
            display: inline-block !important;
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
