"use client";

import { useState } from 'react';
import { TransactionForm } from '@/components/TransactionForm';
import { Plus, History, Filter, Download } from 'lucide-react';

const MOCK_TRANSACTIONS = [
  { id: 1, date: '2024-03-10', asset: 'NVIDIA Corp', ticker: 'NVDA', type: 'Buy', qty: 5, price: '850.20€', total: '4.251,00€' },
  { id: 2, date: '2024-03-05', asset: 'Apple Inc', ticker: 'AAPL', type: 'Buy', qty: 10, price: '175.40€', total: '1.754,00€' },
  { id: 3, date: '2024-02-28', asset: 'Vanguard S&P 500', ticker: 'VUSA', type: 'Buy', qty: 50, price: '72.10€', total: '3.605,00€' },
  { id: 4, date: '2024-02-15', asset: 'Bitcoin', ticker: 'BTC', type: 'Buy', qty: 0.05, price: '45.000€', total: '2.250,00€' },
];

export default function TransactionsPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold font-outfit mb-2">Transacciones</h1>
          <p className="text-zinc-400">Historial completo de tus movimientos de inversión.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-5 h-5" />
          <span>Añadir Transacción</span>
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1 glass flex items-center px-4 py-2 rounded-xl group focus-within:ring-2 focus-within:ring-blue-600/50 transition-all">
          <Filter className="w-4 h-4 text-zinc-500 mr-2" />
          <input 
            type="text" 
            placeholder="Buscar por activo o ticker..." 
            className="bg-transparent border-none focus:outline-none text-sm w-full py-1"
          />
        </div>
        <button className="glass p-3 rounded-xl hover:bg-white/5 transition-colors">
          <Download className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      <div className="glass-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-zinc-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Activo</th>
                <th className="px-6 py-4 font-semibold">Tipo</th>
                <th className="px-6 py-4 font-semibold text-right">Cantidad</th>
                <th className="px-6 py-4 font-semibold text-right">Precio</th>
                <th className="px-6 py-4 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MOCK_TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-400">{tx.date}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-100">{tx.asset}</div>
                    <div className="text-xs text-zinc-500">{tx.ticker}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-blue-400 font-medium px-2 py-1 rounded-lg bg-blue-600/10 border border-blue-600/20">
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-zinc-300">{tx.qty}</td>
                  <td className="px-6 py-4 text-sm text-right text-zinc-300">{tx.price}</td>
                  <td className="px-6 py-4 text-sm text-right text-zinc-100 font-bold">{tx.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <TransactionForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
