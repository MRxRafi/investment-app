"use client";

import { useState, useEffect } from 'react';
import { AssetType, TransactionType } from '@/types';
import { Plus, X, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Asset {
  id: string;
  name: string;
  ticker: string;
}

export function TransactionForm({ 
  onClose, 
  transaction 
}: { 
  onClose: () => void, 
  transaction?: any 
}) {
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState(transaction?.assets?.ticker || transaction?.assets?.name || '');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(transaction?.assets ? { 
    id: transaction.asset_id, 
    name: transaction.assets.name, 
    ticker: transaction.assets.ticker 
  } : null);
  const [showResults, setShowResults] = useState(false);

  const [formData, setFormData] = useState({
    type: transaction?.transaction_type || 'Buy' as TransactionType,
    quantity: transaction?.quantity || '',
    price: transaction?.price_per_unit || '',
    fee: transaction?.fee || '0',
    date: transaction?.transaction_date ? new Date(transaction.transaction_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (search.length > 1 && !selectedAsset) {
      const delayDebounceFn = setTimeout(() => {
        searchAssets();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setAssets([]);
      setShowResults(false);
    }
  }, [search]);

  async function searchAssets() {
    const { data, error } = await supabase
      .from('assets')
      .select('id, name, ticker')
      .or(`name.ilike.%${search}%,ticker.ilike.%${search}%`)
      .limit(5);

    if (!error && data) {
      setAssets(data);
      setShowResults(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAsset) return alert('Por favor selecciona un activo');

    try {
      setLoading(true);
      const payload = {
        asset_id: selectedAsset.id,
        transaction_type: formData.type,
        quantity: parseFloat(formData.quantity.toString()),
        price_per_unit: parseFloat(formData.price.toString()),
        fee: parseFloat(formData.fee.toString()),
        transaction_date: formData.date,
        currency: 'EUR' // Default to EUR for now
      };

      let error;
      if (transaction?.id) {
        // Update
        const { error: err } = await supabase
          .from('transactions')
          .update(payload)
          .eq('id', transaction.id);
        error = err;
      } else {
        // Insert
        const { error: err } = await supabase
          .from('transactions')
          .insert([payload]);
        error = err;
      }

      if (error) throw error;
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Error al guardar la transacción');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold font-outfit">
            {transaction ? 'Editar Transacción' : 'Nueva Transacción'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tipo</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
              >
                <option value="Buy">Compra</option>
                <option value="Sell">Venta</option>
                <option value="Dividend">Dividendo</option>
              </select>
            </div>
            <div className="space-y-1.5 relative">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Activo</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (selectedAsset) setSelectedAsset(null);
                  }}
                  placeholder="Buscar activo..." 
                  className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                />
                {selectedAsset && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600/20 text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-600/30">
                    OK
                  </div>
                )}
              </div>
              
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl">
                  {assets.map(asset => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => {
                        setSelectedAsset(asset);
                        setSearch(asset.name);
                        setShowResults(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                    >
                      <div className="text-sm font-medium">{asset.name}</div>
                      <div className="text-xs text-zinc-500">{asset.ticker}</div>
                    </button>
                  ))}
                  {assets.length === 0 && (
                    <div className="px-4 py-3 text-sm text-zinc-500 italic">No se encontraron activos</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Cantidad</label>
              <input 
                type="number" 
                step="any"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                placeholder="0.00" 
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Precio unidad</label>
              <input 
                type="number" 
                step="any"
                required
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="0.00 €" 
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Fecha</label>
            <input 
              type="date" 
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
            />
          </div>

          <div className="pt-4">
            <button 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              <span>{transaction ? 'Actualizar Transacción' : 'Guardar Transacción'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
