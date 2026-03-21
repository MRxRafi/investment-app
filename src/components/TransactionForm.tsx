"use client";

import { useState } from 'react';
import { AssetType, TransactionType } from '@/types';
import { Plus, X } from 'lucide-react';

export function TransactionForm({ onClose }: { onClose: () => void }) {
  const [formData] = useState({
    ticker: '',
    type: 'Buy' as TransactionType,
    quantity: '',
    price: '',
    fee: '0',
    date: new Date().toISOString().split('T')[0],
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold font-outfit">Nueva Transacción</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tipo</label>
              <select className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50">
                <option value="Buy">Compra</option>
                <option value="Sell">Venta</option>
                <option value="Dividend">Dividendo</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ticker / Activo</label>
              <input 
                type="text" 
                placeholder="NVDA, AAPL..." 
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Cantidad</label>
              <input 
                type="number" 
                placeholder="0.00" 
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Precio unidad</label>
              <input 
                type="number" 
                placeholder="0.00 €" 
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Fecha</label>
            <input 
              type="date" 
              defaultValue={formData.date}
              className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
            />
          </div>

          <div className="pt-4">
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]">
              Guardar Transacción
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
