'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle2, AlertCircle, X, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { searchTickers, getAssetInfo } from '../../lib/yahoo';

interface AddAssetFormProps {
  onAssetAdded: () => void;
  onCancel: () => void;
}

interface Prediction {
  ticker: string;
  name: string;
  exchange: string;
  quoteType: string;
}

interface AssetInfo {
  ticker: string;
  name: string;
  price: number;
  currency: string;
  exchange: string;
  quoteType: string;
}

export function AddAssetForm({ onAssetAdded, onCancel }: AddAssetFormProps) {
  const [ticker, setTicker] = useState('');
  const [source, setSource] = useState<'yahoo' | 'sg'>('yahoo');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [assetInfo, setAssetInfo] = useState<AssetInfo | null>(null);
  const [category, setCategory] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const categories = [
    { id: 'Acciones', label: 'Acciones' },
    { id: 'Cripto', label: 'Cripto' },
    { id: 'ETFs', label: 'ETFs' },
    { id: 'Efectivo', label: 'Efectivo' },
    { id: 'Derivados', label: 'Derivados' },
    { id: 'Otros', label: 'Otros' }
  ];

  // Auto-search for predictions based on active source
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (ticker.length >= 2) {
        const results = await searchTickers(ticker, source);
        setPredictions(results);
        setShowPredictions(true);
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [ticker, source]);

  const handleSelectPrediction = (p: Prediction) => {
    setTicker(p.ticker);
    setPredictions([]);
    setShowPredictions(false);
    handleSearch(p.ticker);
  };

  const handleSearch = async (forcedTicker?: string) => {
    const searchTicker = forcedTicker || ticker;
    if (!searchTicker) return;
    
    setSearching(true);
    setError(null);
    setAssetInfo(null);
    setShowPredictions(false);
    
    try {
      const data = await getAssetInfo(searchTicker, source);
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

    const finalCategory = showCustomInput ? customCategory : category;
    if (!finalCategory) {
      setError("Por favor, selecciona una categoría");
      setLoading(false);
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('assets')
        .insert([{
          ticker: assetInfo.ticker,
          name: assetInfo.name,
          category: finalCategory,
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
          <p className="text-zinc-500 text-xs mt-1">Configura la fuente y busca el activo.</p>
        </div>
        <button onClick={onCancel} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
          <X className="w-5 h-5 text-zinc-500" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Source Selector */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Fuente de Datos</label>
          <div className="grid grid-cols-2 p-1 bg-zinc-950/50 border border-white/5 rounded-xl">
            <button
              onClick={() => setSource('yahoo')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                source === 'yahoo' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              YAHOO FINANCE
            </button>
            <button
              onClick={() => setSource('sg')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                source === 'sg' 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              SOCIÉTÉ GÉNÉRALE
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2 relative">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1 flex items-center gap-1.5">
              <Search className="w-2.5 h-2.5" /> Ticker o ISIN
            </label>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder={source === 'yahoo' ? "Ej: AAPL, BTC-USD..." : "Ej: SW89VA, DE000..."}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
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
                onClick={() => handleSearch()}
                disabled={searching || !ticker}
                className={`px-6 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  source === 'yahoo' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-600 hover:bg-red-500'
                } text-white disabled:opacity-50`}
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Buscar
              </button>
            </div>
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
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Activo Seleccionado</p>
                  <h4 className="text-lg font-bold text-white leading-tight mt-1">{assetInfo.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-zinc-400">{assetInfo.ticker}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500 font-bold">{assetInfo.exchange}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Precio Actual</p>
                  <p className="text-2xl font-black text-white font-mono mt-1">
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: assetInfo.currency }).format(assetInfo.price)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Categoría</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        setShowCustomInput(cat.id === 'Otros');
                      }}
                      className={`py-2.5 px-2 rounded-xl text-[10px] font-bold border transition-all ${
                        category === cat.id
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                          : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {showCustomInput && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Especificar Categoría</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Ej: Metales, Arte..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Confirmar y Añadir"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
