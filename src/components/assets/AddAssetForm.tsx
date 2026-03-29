"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Loader2, X, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { searchTickers, getAssetInfo } from '@/lib/yahoo';

interface AssetInfo {
  ticker: string;
  name: string;
  price: number;
  currency: string;
  exchange?: string;
}

interface Prediction {
  ticker: string;
  name: string;
  exchange: string;
  quoteType: string;
}

export function AddAssetForm({ onAssetAdded, onCancel }: { onAssetAdded: () => void, onCancel: () => void }) {
  const [ticker, setTicker] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [assetInfo, setAssetInfo] = useState<AssetInfo | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [tipo, setTipo] = useState('Acciones');
  const [customTipo, setCustomTipo] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch unique categories from DB
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('tipo')
        .not('tipo', 'is', null);
      
      if (!error && data) {
        const unique = Array.from(new Set(data.map(item => item.tipo)));
        // Default standard ones if not present
        const standard = ["Acciones", "ETF", "Fondos", "Cripto", "Deuda"];
        const combined = Array.from(new Set([...standard, ...unique]));
        setCategories(combined.sort());
      }
    };
    fetchCategories();
  }, []);

  // Autocomplete search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (ticker.length >= 2) {
        try {
          const data = await searchTickers(ticker);
          setPredictions(data);
          setShowPredictions(true);
        } catch (err) {
          console.error("Prediction fetch failed", err);
        }
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [ticker]);

  const handleSelectPrediction = async (p: Prediction) => {
    setTicker(p.ticker);
    setShowPredictions(false);
    
    // Auto-fetch full info
    setSearching(true);
    setAssetInfo(null);
    try {
      const data = await getAssetInfo(p.ticker);
      if (data) {
        setAssetInfo(data);
      }
    } catch (err) {
      console.error("Info fetch failed", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!ticker) return;
    setSearching(true);
    setError(null);
    setAssetInfo(null);
    setShowPredictions(false);
    
    try {
      const data = await getAssetInfo(ticker);
      if (!data) throw new Error('Activo no encontrado');
      setAssetInfo(data);
    } catch (err: any) {
      setError(err.message || 'Error al buscar el activo');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetInfo) return;

    setLoading(true);
    setError(null);

    const finalTipo = showCustomInput ? customTipo : tipo;
    if (!finalTipo) {
      setError("Por favor especifica un tipo para el activo");
      setLoading(false);
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('assets')
        .insert([{
          ticker: assetInfo.ticker,
          name: assetInfo.name,
          tipo: finalTipo,
          current_price: assetInfo.price,
          last_price_update: new Date().toISOString()
        }]);

      if (insertError) {
        if (insertError.code === '23505') throw new Error('Este activo ya existe');
        throw insertError;
      }

      setSuccess(true);
      setTimeout(() => onAssetAdded(), 1500);
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-10 text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold font-outfit">¡Activo Añadido!</h3>
        <p className="text-zinc-400 text-sm">Todo listo. El activo ya forma parte de tu cartera.</p>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 space-y-6 animate-in slide-in-from-top-4 duration-500 relative">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold font-outfit leading-none">Añadir Activo</h3>
          <p className="text-zinc-500 text-xs mt-1">Busca activos en Yahoo Finance.</p>
        </div>
        <button onClick={onCancel} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
          <X className="w-5 h-5 text-zinc-500" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Ticker Input with Predictions */}
        <div className="space-y-2 relative">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1 flex items-center gap-1.5">
            <Search className="w-2.5 h-2.5" /> Ticker
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Ej: AAPL, BTC-EUR..."
                className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-outfit text-base"
              />
              
              {showPredictions && predictions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-[999] overflow-hidden backdrop-blur-xl max-h-[250px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
                  {predictions.map((p, idx) => (
                    <button
                      key={`${p.ticker}-${idx}`}
                      onClick={() => handleSelectPrediction(p)}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center justify-between border-b border-white/5 last:border-0 transition-colors group"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white group-hover:text-blue-400 transition-colors text-sm uppercase">{p.ticker}</span>
                          <span className="text-[8px] px-1 py-0.5 bg-zinc-800 rounded text-zinc-500 font-bold uppercase tracking-tighter">{p.quoteType}</span>
                        </div>
                        <p className="text-xs text-zinc-500 truncate">{p.name}</p>
                      </div>
                      <ChevronRight className="w-3 h-3 text-zinc-700 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !ticker}
              className="px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50 text-sm"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2 text-red-400 text-xs animate-in shake-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {assetInfo && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Metadata Preview */}
            <div className="p-4 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl relative overflow-hidden group">
              <div className="flex justify-between items-center gap-4 relative z-10">
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-base font-bold font-outfit text-white leading-tight truncate">{assetInfo.name}</h4>
                  <p className="text-[10px] text-zinc-500 font-bold flex items-center gap-1.5">
                    <span className="text-blue-400 uppercase">{assetInfo.ticker}</span>
                    <span className="w-0.5 h-0.5 bg-zinc-700 rounded-full"></span>
                    <span className="truncate">{assetInfo.exchange}</span>
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-black font-outfit text-white">
                    {assetInfo.price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </p>
                  <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest leading-none mt-0.5">Precio</p>
                </div>
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-1">Categoría</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((opt, idx) => (
                  <button
                    key={`${opt}-${idx}`}
                    type="button"
                    onClick={() => { setTipo(opt); setShowCustomInput(false); }}
                    className={cn(
                      "px-3 py-2.5 rounded-xl text-[11px] font-bold border transition-all duration-300",
                      tipo === opt && !showCustomInput
                        ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                        : "bg-zinc-900/50 text-zinc-400 border-white/5 hover:border-white/10"
                    )}
                  >
                    {opt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className={cn(
                    "px-3 py-2.5 rounded-xl text-[11px] font-bold border transition-all duration-300 flex items-center justify-center gap-1.5",
                    showCustomInput 
                      ? "bg-blue-600 text-white border-blue-500" 
                      : "bg-zinc-900/50 text-zinc-400 border-white/5 hover:text-blue-400"
                  )}
                >
                  <Plus className="w-3 h-3" />
                  <span>Otro...</span>
                </button>
              </div>

              {showCustomInput && (
                <div className="mt-2 animate-in slide-in-from-top-1">
                  <input
                    type="text"
                    value={customTipo}
                    onChange={(e) => setCustomTipo(e.target.value)}
                    placeholder="Nueva categoría..."
                    className="w-full bg-zinc-900 border border-blue-500/30 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-bold text-white text-xs"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white hover:bg-zinc-100 text-black font-black rounded-2xl transition-all shadow-xl flex items-center justify-center space-x-2 text-base group"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <Plus className="w-5 h-5" />
                  <span className="font-outfit">Guardar Activo</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

