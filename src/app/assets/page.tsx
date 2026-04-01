"use client";

import { useEffect, useState, useCallback } from 'react';
import { Asset, Transaction } from '@/types';
import { AddAssetForm } from '@/components/assets/AddAssetForm';
import { TrendingUp, TrendingDown, Loader2, Plus, ArrowUpRight, Edit2, Trash2, AlertTriangle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { getPrice } from '@/lib/yahoo';
import { calculateAssetStats } from '@/lib/finance';

interface AssetStats {
  id: string;
  name: string;
  ticker: string;
  category: string;
  weight: number;
  value: number;
  return: number;
}

export default function AssetsPage() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<AssetStats[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetStats | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [deletingAsset, setDeletingAsset] = useState<AssetStats | null>(null);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('category')
        .not('category', 'is', null);
      
      if (!error && data) {
        const unique = Array.from(new Set(data.map(item => item.category)));
        const standard = ["Stock", "ETF", "Fund", "Crypto", "Debt", "Liquidity"];
        const combined = Array.from(new Set([...standard, ...unique]));
        setCategories(combined.sort());
      }
    } catch (e) {
      console.error("Error fetching categories:", e);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: assetsData, error: assetsError } = await supabase.from('assets').select('*');
      const { data: txData, error: txError } = await supabase.from('transactions').select('*');

      if (assetsError || txError) throw assetsError || txError;

      const rawAssets: Asset[] = (assetsData || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        ticker: item.ticker,
        currentPrice: Number(item.current_price) || 0,
        category: item.category || item.tipo, // Future proofing
      }));

      await fetchCategories();

      const transactions = (txData || []).map((item: any) => ({
        ...item,
        type: item.type || item.transaction_type, // Future proofing
        date: item.date || item.transaction_date,
      }));

      const priceMap: Record<string, number> = {};
      
      const tickers = Array.from(new Set(rawAssets.map(a => a.ticker).filter(t => t && t !== '---')));
      await Promise.all(tickers.map(async (ticker) => {
        try {
          const data = await getPrice(ticker);
          if (data && typeof data.price === 'number') {
            priceMap[ticker] = data.price;
          }
        } catch (e) {
          console.warn(`Price fetch failed for ${ticker}`);
        }
      }));

      // Standardize for finance engine
      const mappedTransactions = transactions.map(t => ({
        id: t.id,
        assetId: t.asset_id,
        type: t.type,
        quantity: Number(t.quantity),
        pricePerUnit: Number(t.price_per_unit),
        fee: Number(t.fee || 0),
        date: t.date
      }));

      const assetStats = calculateAssetStats(rawAssets, mappedTransactions, priceMap);
      const totalValue = assetStats.reduce((acc, s) => acc + s.currentValue, 0);

      const finalAssets = assetStats
        .map(s => {
          const rawAsset = rawAssets.find(ra => ra.ticker === s.ticker && ra.name === s.name);
          return {
            id: rawAsset?.id || '',
            name: s.name,
            ticker: s.ticker || '---',
            category: rawAsset?.category || 'Stock',
            weight: totalValue > 0 ? Number(((s.currentValue / totalValue) * 100).toFixed(1)) : 0,
            value: s.currentValue,
            return: s.pnlPercent
          };
        })
        .filter(s => s.value > 0.01 || s.value < -0.01)
        .sort((a, b) => b.value - a.value);

      setAssets(finalAssets);
      setAllTransactions(transactions);
    } catch (error) {
      console.error('Error fetching assets data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update categories when modal opens
  useEffect(() => {
    if (showCategoriesModal) {
      fetchCategories();
    }
  }, [showCategoriesModal]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssetAdded = () => {
    setShowAddForm(false);
    fetchData();
  };

  const handleEdit = (asset: AssetStats) => {
    setEditingAsset(asset);
    setEditName(asset.name);
    setEditCategory(asset.category);
  };

  const saveEdit = async () => {
    if (!editingAsset) return;
    try {
      const { error } = await supabase
        .from('assets')
        .update({ name: editName, category: editCategory })
        .eq('id', editingAsset.id);
      if (error) throw error;
      setEditingAsset(null);
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Error al actualizar el activo");
    }
  };

  const confirmDelete = async () => {
    if (!deletingAsset) return;
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', deletingAsset.id);
      if (error) throw error;
      setDeletingAsset(null);
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Error al eliminar el activo");
    } finally {
      setIsDeleting(false);
    }
  };

  const standardCategories = ["Stock", "ETF", "Fund", "Crypto", "Debt", "Liquidity"];

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const trimmed = newCategoryName.trim();
    if (categories.includes(trimmed)) {
      alert("Esta categoría ya existe");
      return;
    }
    const newCategories = [...categories, trimmed].sort();
    setCategories(newCategories);
    setNewCategoryName("");
  };

  const handleRenameCategory = async (oldName: string) => {
    if (!newCategoryName.trim() || oldName === newCategoryName.trim()) {
      setEditingCategory(null);
      setNewCategoryName("");
      return;
    }
    const trimmed = newCategoryName.trim();
    if (categories.includes(trimmed)) {
      alert("Esta categoría ya existe");
      return;
    }
    try {
      const { error } = await supabase
        .from('assets')
        .update({ category: trimmed })
        .eq('category', oldName);
      if (error) throw error;
      // Actualizar estado local inmediatamente
      const newCategories = categories.map(c => c === oldName ? trimmed : c).sort();
      setCategories(newCategories);
      setEditingCategory(null);
      setNewCategoryName("");
      await fetchCategories(); // Refrescar desde BD por si acaso
      await fetchData(); // Refrescar datos completos
    } catch (e) {
      console.error("Error renombrando categoría:", e);
      alert("Error al renombrar la categoría");
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (standardCategories.includes(category)) {
      alert("No se pueden eliminar las categorías estándar");
      return;
    }
    
    try {
      console.log(`Intentando eliminar categoría: ${category}`);
      
      // Verificar en BD si hay activos con esta categoría
      const { data: assetsInCategory, error: checkError } = await supabase
        .from('assets')
        .select('id')
        .eq('category', category);
      
      if (checkError) {
        console.error("Error verificando categoría en BD:", checkError);
        throw checkError;
      }
      
      console.log(`Activos encontrados con categoría ${category}:`, assetsInCategory?.length || 0);
      
      if (assetsInCategory && assetsInCategory.length > 0) {
        if (!confirm(`Hay ${assetsInCategory.length} activos en esta categoría. Se moverán a "Stock". ¿Continuar?`)) return;
        
        console.log(`Actualizando ${assetsInCategory.length} activos a Stock...`);
        const { error: updateError } = await supabase
          .from('assets')
          .update({ category: 'Stock' })
          .eq('category', category);
        
        if (updateError) {
          console.error("Error actualizando activos en BD:", updateError);
          throw updateError;
        }
        console.log("Activos actualizados exitosamente");
      }
      
      // Actualizar lista local
      const newCategories = categories.filter(c => c !== category);
      setCategories(newCategories);
      
      // Refrescar datos desde BD
      await fetchCategories();
      await fetchData();
      
      alert(`Categoría "${category}" eliminada${assetsInCategory?.length ? ' y activos movidos a Stock' : ''}`);
    } catch (e) {
      console.error("Error completo eliminando categoría:", e);
      alert("Error al eliminar la categoría");
    }
  };

  if (loading) {
    return (
      <div className="section-container flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
        <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest animate-pulse">Scanning Matrix...</p>
      </div>
    );
  }

  return (
    <div className="section-container space-y-10 py-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black font-outfit tracking-tighter text-white uppercase italic">
            Mis <span className="text-yellow-500">Activos</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium font-plus-jakarta tracking-wide">
            Distribución estratégica y métricas individuales de rendimiento.
          </p>
        </div>
        <button
          onClick={() => setShowCategoriesModal(true)}
          className="w-full sm:w-auto px-6 py-4 bg-zinc-900 border border-white/10 text-white font-black font-outfit text-sm uppercase tracking-wider rounded-xl hover:bg-white/5 transition-all flex items-center justify-center space-x-3"
        >
          <span>Categorías</span>
        </button>
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full sm:w-auto px-8 py-4 bg-yellow-500 text-black font-black font-outfit text-sm uppercase tracking-wider rounded-xl hover:bg-yellow-400 transition-all flex items-center justify-center space-x-3 shadow-[0_0_30px_rgba(250,204,21,0.2)] border-2 border-black/10 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Añadir Activo</span>
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500" />
            <AddAssetForm
              onAssetAdded={handleAssetAdded}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}

      <div className="glass-card !p-0 overflow-hidden border-white/10 shadow-2xl">
        <div className="bg-white/[0.02] px-8 py-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-black font-outfit uppercase tracking-[0.2em] text-zinc-400 italic">Posiciones Activas</h3>
          <span className="text-[10px] font-bold text-zinc-600 bg-white/5 px-2 py-1 rounded uppercase tracking-widest">{assets.length} Unidades</span>
        </div>

        {/* Mobile View: Card List */}
        <div className="lg:hidden divide-y divide-white/5">
          {assets.map((asset) => (
            <div key={asset.id} className="p-6 space-y-4 hover:bg-white/[0.01] transition-colors relative group">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center font-black text-[10px] border border-white/10 text-zinc-400 shadow-inner">
                    {asset.ticker}
                  </div>
                  <div>
                    <h4 className="font-black font-outfit text-white tracking-tight uppercase leading-none mb-1">{asset.name}</h4>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest font-plus-jakarta">{asset.ticker}</p>
                      <span className="w-0.5 h-0.5 bg-zinc-700 rounded-full" />
                      <p className="text-[10px] text-yellow-500/60 font-bold uppercase tracking-widest font-plus-jakarta">{asset.category}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1">Peso</p>
                  <p className="text-sm font-black font-outfit text-yellow-500">{asset.weight}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Valorización</p>
                  <p className="text-lg font-black font-outfit text-white">
                    {asset.value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Retorno</p>
                  <div className={cn(
                    "inline-flex items-center font-black font-outfit text-sm",
                    asset.return > 0 ? "text-emerald-500" : asset.return < 0 ? "text-red-500" : "text-zinc-500"
                  )}>
                    {asset.return > 0 ? "+" : ""}{asset.return.toFixed(1)}%
                    <ArrowUpRight className={cn("w-3 h-3 ml-1", asset.return <= 0 && "rotate-90")} />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(asset)}
                    className="p-2 bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-all border border-white/5"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingAsset(asset)}
                    className="p-2 bg-red-500/5 rounded-lg text-zinc-500 hover:text-red-500 transition-all border border-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] border-b border-white/5 font-plus-jakarta">
                <th className="px-8 py-6">Activo / Instrumento</th>
                <th className="px-8 py-6 text-right">Categoría</th>
                <th className="px-8 py-6 text-right">Peso</th>
                <th className="px-8 py-6 text-right">Valorización Total</th>
                <th className="px-8 py-6 text-right">P&L Histórico</th>
                <th className="px-8 py-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-white/[0.02] transition-all group cursor-default">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-5">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center font-black text-[11px] border border-white/5 text-zinc-500 shadow-inner group-hover:border-yellow-500/30 transition-colors">
                        {asset.ticker}
                      </div>
                      <div>
                        <p className="font-black font-outfit text-zinc-100 uppercase tracking-tight text-lg leading-none mb-1 group-hover:text-yellow-500 transition-colors">
                          {asset.name}
                        </p>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.15em] font-plus-jakarta italic">{asset.ticker}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="text-xs font-black font-outfit text-yellow-500/70 uppercase tracking-wider">
                      {asset.category}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="text-sm font-black font-outfit text-zinc-400 hover:text-yellow-500 transition-colors">
                      {asset.weight}%
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="text-xl font-black font-outfit text-white leading-none">
                      {asset.value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<span className="text-zinc-500 ml-1">€</span>
                    </p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className={cn(
                      "inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black font-outfit uppercase tracking-wider border transition-all",
                      asset.return > 0
                        ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/10"
                        : asset.return < 0
                          ? "bg-red-500/5 text-red-400 border-red-500/20 group-hover:bg-red-500/10"
                          : "bg-zinc-800/10 text-zinc-500 border-white/5"
                    )}>
                      {asset.return > 0 && <TrendingUp className="w-3 h-3" />}
                      {asset.return < 0 && <TrendingDown className="w-3 h-3" />}
                      <span>{Math.abs(asset.return).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(asset)}
                        className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingAsset(asset)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <p className="text-zinc-600 font-bold text-sm uppercase tracking-widest font-plus-jakarta animate-pulse">No active positions detected in Sector 7.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500" />
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-black font-outfit text-white uppercase italic tracking-tight">Editar <span className="text-yellow-500">Activo</span></h3>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest font-plus-jakarta italic">{editingAsset.ticker}</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Nombre del Activo</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500/40 transition-all placeholder:text-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Categoría</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500/40 transition-all"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setEditingAsset(null)}
                  className="flex-1 px-6 py-4 bg-zinc-900 text-zinc-400 font-black font-outfit text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all border border-white/5"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  className="flex-1 px-6 py-4 bg-yellow-500 text-black font-black font-outfit text-xs uppercase tracking-widest rounded-xl hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(250,204,21,0.2)]"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAsset && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-zinc-950 border border-red-500/20 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
            <div className="p-8 space-y-6">
              <div className="flex items-center space-x-4 text-red-500 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xl font-black font-outfit uppercase italic tracking-tight">Zona Peligrosa</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Confirmar Eliminación</p>
                </div>
              </div>

              <p className="text-zinc-400 text-sm font-medium font-plus-jakarta leading-relaxed">
                Estás a punto de eliminar <span className="text-white font-black">{deletingAsset.name}</span>. ¿Estás seguro de que deseas proceder?
              </p>

              {allTransactions.filter(t => t.asset_id === deletingAsset.id).length > 0 && (
                <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 space-y-1.5 animate-pulse">
                  <div className="flex items-center space-x-2 text-red-400">
                    <XCircle className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Advertencia de Seguridad</span>
                  </div>
                  <p className="text-[11px] font-bold text-red-500/80 leading-snug">
                    Se han detectado <span className="font-black underline">{allTransactions.filter(t => t.asset_id === deletingAsset.id).length} transacciones</span> asociadas. Al eliminar el activo, todo su historial de trading será borrado permanentemente.
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setDeletingAsset(null)}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-4 bg-zinc-900 text-zinc-400 font-black font-outfit text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all border border-white/5 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-4 bg-red-500 text-white font-black font-outfit text-xs uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Eliminar Activo</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Management Modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500" />
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black font-outfit text-white uppercase italic tracking-tight">Gestionar <span className="text-yellow-500">Categorías</span></h3>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest font-plus-jakarta italic">Añade, renombra o elimina categorías</p>
                </div>
                <button onClick={() => { setShowCategoriesModal(false); setEditingCategory(null); setNewCategoryName(""); }} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <XCircle className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              {/* Add New Category */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Nueva Categoría</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingCategory ? newCategoryName : newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder={editingCategory ? "Nuevo nombre..." : "Nombre de la categoría..."}
                    className="flex-1 bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500/40 transition-all placeholder:text-zinc-700"
                  />
                  {editingCategory ? (
                    <>
                      <button
                        onClick={() => { setEditingCategory(null); setNewCategoryName(""); }}
                        className="px-4 py-3 bg-zinc-800 text-zinc-400 font-bold rounded-xl hover:bg-zinc-700 transition-all border border-white/5"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleRenameCategory(editingCategory)}
                        className="px-4 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-all shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                      >
                        Renombrar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleAddCategory}
                      className="px-5 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-all shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Categories List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Categorías Existentes ({categories.length})</label>
                {categories.map((cat) => (
                  <div key={cat} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-white">{cat}</span>
                      {standardCategories.includes(cat) && (
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest bg-zinc-800 px-2 py-0.5 rounded">Estándar</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingCategory(cat); setNewCategoryName(cat); }}
                        className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!standardCategories.includes(cat) && (
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => { setShowCategoriesModal(false); setEditingCategory(null); setNewCategoryName(""); }}
                  className="px-6 py-3 bg-zinc-900 text-zinc-400 font-black font-outfit text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all border border-white/5"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
