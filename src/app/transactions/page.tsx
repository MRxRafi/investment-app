"use client";

import { useState, useEffect } from 'react';
import { TransactionForm } from '@/components/TransactionForm';
import { Plus, Filter, Download, Loader2, Edit2, Trash2, Calendar, Tag, Layers } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

import { Transaction } from '@/types';
import { useTransactions } from '@/hooks/useTransactions';

export default function TransactionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { transactions, loading, refetch } = useTransactions();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta transacción?')) return;
    
    try {
      setDeletingId(id);
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Error al eliminar la transacción');
    } finally {
      setDeletingId(null);
    }
  }

  const filteredTransactions = transactions.filter(tx => 
    tx.assets?.name.toLowerCase().includes(search.toLowerCase()) || 
    tx.assets?.ticker.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="section-container space-y-10 py-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black font-outfit tracking-tighter text-white uppercase italic">
            Mis <span className="text-yellow-500">Transacciones</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium font-plus-jakarta tracking-wide">
            Historial detallado de transacciones y estados de cuenta.
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto px-8 py-4 bg-yellow-500 text-black font-black font-outfit text-sm uppercase tracking-wider rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center space-x-3 shadow-[0_0_30px_rgba(250,204,21,0.2)] border-2 border-black/10 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Añadir Transacción</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full bg-zinc-900 border border-white/5 flex items-center px-5 py-3 rounded-2xl group focus-within:ring-2 focus-within:ring-yellow-500/40 transition-all">
          <Filter className="w-4 h-4 text-zinc-600 mr-3" />
          <input 
            type="text" 
            placeholder="Filtrar por ticker o nombre del activo..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-[13px] font-bold tracking-tight text-white w-full placeholder:text-zinc-600"
          />
        </div>
        <button className="hidden md:flex bg-zinc-900 border border-white/5 p-4 rounded-2xl hover:bg-white/[0.03] transition-colors group">
          <Download className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
        </button>
      </div>

      <div className="glass-card !p-0 overflow-hidden border-white/10 shadow-2xl">
        <div className="bg-white/[0.02] px-8 py-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-black font-outfit uppercase tracking-[0.2em] text-zinc-400 italic">Historial de Ejecuciones</h3>
          <span className="text-[10px] font-bold text-zinc-600 bg-white/5 px-2 py-1 rounded uppercase tracking-widest">{filteredTransactions.length} Registros</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
            <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em] animate-pulse font-plus-jakarta">Accessing Databases...</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Transaction Cards */}
            <div className="lg:hidden divide-y divide-white/5">
              {filteredTransactions.map((tx) => {
                const total = tx.quantity * tx.pricePerUnit;
                const d = new Date(tx.date);
                
                return (
                  <div key={tx.id} className="p-6 space-y-4 hover:bg-white/[0.01] transition-colors group">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex flex-col items-center justify-center border border-white/10 group-hover:border-yellow-500/20 transition-colors">
                           <span className="text-[9px] font-black text-zinc-500 leading-none uppercase">{d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}</span>
                           <span className="text-sm font-black text-white leading-none">{d.getDate()}</span>
                        </div>
                        <div>
                          <h4 className="font-black font-outfit text-white tracking-tight uppercase leading-none mb-1 text-sm">{tx.assets?.name}</h4>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border",
                            tx.type === 'Buy' ? "text-blue-400 border-blue-500/20 bg-blue-500/5" : "text-orange-400 border-orange-500/20 bg-orange-500/5"
                          )}>
                            {tx.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                         <button 
                            onClick={() => {
                              setEditingTransaction(tx);
                              setShowForm(true);
                            }}
                            className="p-2 hover:bg-white/5 rounded-lg text-zinc-600 hover:text-white transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(tx.id)}
                            disabled={deletingId === tx.id}
                            className="p-2 hover:bg-white/5 rounded-lg text-zinc-600 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <div className="space-y-1">
                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest leading-none">Net Total</p>
                        <p className="text-lg font-black font-outfit text-white leading-none">
                          {total.toLocaleString('es-ES', { maximumFractionDigits: 0 })}<span className="text-zinc-500 text-xs ml-0.5">€</span>
                        </p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest leading-none">Units @ Price</p>
                        <p className="text-[11px] font-bold text-zinc-400 leading-none">
                          {tx.quantity} <span className="text-zinc-600">x</span> {tx.pricePerUnit.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] border-b border-white/5 font-plus-jakarta bg-white/[0.01]">
                    <th className="px-8 py-5">Timestamp</th>
                    <th className="px-8 py-5">Instrument</th>
                    <th className="px-8 py-5 text-center">Operation</th>
                    <th className="px-8 py-5 text-right">Qty</th>
                    <th className="px-8 py-5 text-right">Unit Price</th>
                    <th className="px-8 py-5 text-right">Net Liquidation</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTransactions.map((tx) => {
                    const total = tx.quantity * tx.pricePerUnit;
                    const dateFormatted = new Date(tx.date).toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    });

                    return (
                      <tr key={tx.id} className="hover:bg-white/[0.02] transition-all group font-plus-jakarta border-l-4 border-l-transparent hover:border-l-yellow-500/40">
                        <td className="px-8 py-6 text-[12px] font-bold text-zinc-500 uppercase">
                          {dateFormatted}
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-black font-outfit text-white uppercase tracking-tight text-base leading-none mb-1 group-hover:text-yellow-500 transition-colors">
                            {tx.assets?.name}
                          </div>
                          <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{tx.assets?.ticker}</div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                            tx.type === 'Buy' 
                              ? 'text-blue-400 bg-blue-500/5 border-blue-500/10' 
                              : 'text-orange-400 bg-orange-600/10 border-orange-500/20'
                          )}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right text-[13px] font-bold text-zinc-400">
                          {Number(tx.quantity).toLocaleString('es-ES', { maximumFractionDigits: 4 })}
                        </td>
                        <td className="px-8 py-6 text-right text-[13px] font-bold text-zinc-400">
                          {Number(tx.pricePerUnit).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </td>
                        <td className="px-8 py-6 text-right font-black font-outfit text-lg text-white">
                          {total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end space-x-2 opacity-30 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingTransaction(tx);
                                setShowForm(true);
                              }}
                              className="p-2.5 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(tx.id)}
                              disabled={deletingId === tx.id}
                              className="p-2.5 hover:bg-red-500/10 rounded-xl text-zinc-500 hover:text-red-500 transition-all"
                            >
                              {deletingId === tx.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

       {showForm && <TransactionForm 
        transaction={editingTransaction}
        onClose={() => {
          setShowForm(false);
          setEditingTransaction(null);
          refetch();
        }} 
      />}
    </div>
  );
}
