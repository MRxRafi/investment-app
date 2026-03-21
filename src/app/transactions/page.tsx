"use client";

import { useState, useEffect } from 'react';
import { TransactionForm } from '@/components/TransactionForm';
import { Plus, Filter, Download, Loader2, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: string;
  transaction_date: string;
  transaction_type: string;
  quantity: number;
  price_per_unit: number;
  fee: number;
  currency: string;
  assets: {
    name: string;
    ticker: string;
  };
}

export default function TransactionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          assets (
            id,
            name,
            ticker
          )
        `)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta transacción?')) return;
    
    try {
      setDeletingId(id);
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Error al eliminar la transacción');
    } finally {
      setDeletingId(null);
    }
  }

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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-zinc-500 animate-pulse">Cargando transacciones...</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-zinc-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 font-semibold">Fecha</th>
                  <th className="px-6 py-4 font-semibold">Activo</th>
                  <th className="px-6 py-4 font-semibold">Tipo</th>
                   <th className="px-6 py-4 font-semibold text-right">Cantidad</th>
                  <th className="px-6 py-4 font-semibold text-right">Precio</th>
                  <th className="px-6 py-4 font-semibold text-right">Total</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((tx) => {
                  const total = tx.quantity * tx.price_per_unit;
                  const dateFormatted = new Date(tx.transaction_date).toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  });

                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {dateFormatted}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-100">{tx.assets?.name || 'Unknown'}</div>
                        <div className="text-xs text-zinc-500">{tx.assets?.ticker || '---'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`font-medium px-2 py-1 rounded-lg border ${
                          tx.transaction_type === 'Buy' 
                            ? 'text-blue-400 bg-blue-600/10 border-blue-600/20' 
                            : 'text-orange-400 bg-orange-600/10 border-orange-600/20'
                        }`}>
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-zinc-300">
                        {Number(tx.quantity).toLocaleString('es-ES', { maximumFractionDigits: 4 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-zinc-300">
                        {Number(tx.price_per_unit).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </td>
                       <td className="px-6 py-4 text-sm text-right text-zinc-100 font-bold">
                        {total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => {
                              setEditingTransaction(tx);
                              setShowForm(true);
                            }}
                            className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-blue-400 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(tx.id)}
                            disabled={deletingId === tx.id}
                            className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            {deletingId === tx.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                      No se encontraron transacciones.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

       {showForm && <TransactionForm 
        transaction={editingTransaction}
        onClose={() => {
          setShowForm(false);
          setEditingTransaction(null);
          fetchTransactions();
        }} 
      />}
    </div>
  );
}
