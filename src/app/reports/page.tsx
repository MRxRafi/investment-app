"use client";

import { useRef } from 'react';
import { SummaryCard } from '@/components/SummaryCard';
import { FileText, Download, Printer, Share2, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReportsPage() {
  const reportRef = useRef<HTMLDivElement>(null);

  const exportPDF = async () => {
    if (!reportRef.current) return;
    
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#09090b', // Zinc-950
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Portfolio_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-outfit mb-2">Reportes</h1>
          <p className="text-zinc-400">Genera informes detallados para impresión o análisis offline.</p>
        </div>
        <div className="flex space-x-3">
          <button className="glass p-2.5 rounded-xl hover:bg-white/5 transition-colors">
            <Share2 className="w-5 h-5 text-zinc-400" />
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
          >
            <Printer className="w-5 h-5" />
            <span>Imprimir Informe</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card hover:border-blue-600/30 cursor-pointer group">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-blue-600/10 border border-blue-600/20 group-hover:bg-blue-600/20 transition-colors">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-100">Mensual</h4>
              <p className="text-sm text-zinc-500">Cierre de Febrero 2024</p>
            </div>
          </div>
        </div>
        {/* Ad-hoc report generators could go here */}
      </div>

      {/* Report Preview / Printable Area */}
      <div className="border border-white/10 rounded-2xl overflow-hidden bg-black shadow-2xl">
        <div className="bg-zinc-900/50 p-4 border-b border-white/5 flex justify-between items-center">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Vista Previa de Impresión (A4)</span>
            <span className="text-xs text-zinc-500">1 de 1</span>
        </div>
        
        <div 
          ref={reportRef}
          className="bg-zinc-950 p-12 text-zinc-50 max-w-[800px] mx-auto min-h-[1100px]"
          id="printable-report"
        >
          <div className="flex justify-between items-start border-b border-white/10 pb-8 mb-8">
            <div>
              <h2 className="text-3xl font-bold font-outfit mb-1">Informe de Inversiones</h2>
              <p className="text-zinc-400">Generado el {new Date().toLocaleDateString('es-ES')}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-blue-400">RafaDrive</p>
              <p className="text-sm text-zinc-500">Cartera Consolidada</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
             <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                <p className="text-sm text-zinc-500 font-medium mb-1">Valor Total</p>
                <p className="text-3xl font-bold font-outfit">55.240,42 €</p>
             </div>
             <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                <p className="text-sm text-zinc-500 font-medium mb-1">Rentabilidad Total</p>
                <p className="text-3xl font-bold font-outfit text-green-400">+12.4%</p>
             </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold border-b border-white/5 pb-2">Resumen de Activos</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-zinc-500 uppercase tracking-widest border-b border-white/10">
                  <th className="py-2">Activo</th>
                  <th className="py-2 text-right">Peso</th>
                  <th className="py-2 text-right">Valor</th>
                  <th className="py-2 text-right">Retorno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr className="text-sm">
                  <td className="py-3">NVIDIA Corp (NVDA)</td>
                  <td className="py-3 text-right">35%</td>
                  <td className="py-3 text-right">19.334 €</td>
                  <td className="py-3 text-right text-green-400">+45%</td>
                </tr>
                <tr className="text-sm">
                  <td className="py-3">Apple Inc (AAPL)</td>
                  <td className="py-3 text-right">15%</td>
                  <td className="py-3 text-right">8.286 €</td>
                  <td className="py-3 text-right text-green-400">+4.8%</td>
                </tr>
                <tr className="text-sm">
                  <td className="py-3">Vanguard S&P 500 (VUSA)</td>
                  <td className="py-3 text-right">45%</td>
                  <td className="py-3 text-right">24.858 €</td>
                  <td className="py-3 text-right text-green-400">+8.0%</td>
                </tr>
                <tr className="text-sm">
                  <td className="py-3 font-bold">TOTAL EXPOSICIÓN</td>
                  <td className="py-3 text-right font-bold">95%</td>
                  <td className="py-3 text-right font-bold">52.478 €</td>
                  <td className="py-3 text-right font-bold text-green-400">+12.4%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-12 text-center text-xs text-zinc-600 border-t border-white/5 pt-8">
            <p>Este informe ha sido generado automáticamente por Portfolio Tracker App.</p>
            <p className="mt-1">Página 1 de 1</p>
          </div>
        </div>
      </div>
    </div>
  );
}
