import { Asset, Transaction, AssetStats, DashboardStats, PerformancePoint } from '@/types';

export function calculateAssetStats(assets: Asset[], transactions: Transaction[], currentPrices: Record<string, number>): AssetStats[] {
  // Pre-group transactions by asset_id for O(1) lookup during mapping
  const txByAsset = new Map<string, Transaction[]>();
  transactions.forEach(t => {
    if (!txByAsset.has(t.asset_id)) txByAsset.set(t.asset_id, []);
    txByAsset.get(t.asset_id)!.push(t);
  });

  return assets.map(asset => {
    const assetTx = txByAsset.get(asset.id) || [];
    
    let qty = 0;
    let invested = 0;
    
    assetTx.forEach(t => {
      const q = Number(t.quantity);
      const p = Number(t.price_per_unit);
      const f = Number(t.fee || 0);
      
      if (t.transaction_type === 'Buy' || t.transaction_type === 'Deposit') {
        qty += q;
        invested += (q * p) + f;
      } else if (t.transaction_type === 'Sell' || t.transaction_type === 'Withdrawal') {
        qty -= q;
        invested -= (q * p) - f;
      } else if (t.transaction_type === 'Dividend') {
        // Dividends reduce the net invested amount in the asset (cash coming back)
        invested -= (q * p); 
      }
    });

    const isStaticValue = asset.tipo === 'Capital' || asset.tipo === 'Deuda';
    const currentPrice = isStaticValue ? 1.0 : (currentPrices[asset.ticker] || Number(asset.current_price || 0));
    
    // For Static assets like Cash/Debt, their value is strictly the net cash flow (invested)
    // because users might input a transaction of qty=1, price=-5000 instead of qty=-5000, price=1.
    const currentValue = isStaticValue ? invested : qty * currentPrice;
    
    // For regular assets, PnL is Value - Invested
    // For Static assets like Cash/Debt, PnL is 0
    const pnl = isStaticValue ? 0 : currentValue - invested;
    const pnlPercent = (!isStaticValue && invested !== 0) ? (pnl / invested) * 100 : 0;

    return {
      name: asset.name,
      ticker: asset.ticker,
      invested,
      quantity: qty,
      currentPrice,
      currentValue,
      pnl,
      pnlPercent
    };
  });
}

export function calculateDashboardStats(assetStats: AssetStats[], assets: Asset[], performanceData: PerformancePoint[]): DashboardStats {
  const cashAssets = assets.filter(a => a.tipo === 'Capital');
  const nonCashStats = assetStats.filter(s => !cashAssets.some(ca => ca.ticker === s.ticker));
  
  // New Capital Inicial is strictly the sum of all invested funds across non-capital assets (including Debt)
  const capitalInicial = nonCashStats.reduce((acc, s) => acc + s.invested, 0);

  // Total Value includes ONLY non-capital assets (Rest of portfolio + Debt)
  const totalValue = nonCashStats.reduce((acc, s) => acc + s.currentValue, 0);
  
  // Total Invested is the capital Inicial
  const totalInvested = capitalInicial;
  
  const totalPnL = totalValue - totalInvested;
  const totalPnLPercent = totalInvested !== 0 ? (totalPnL / totalInvested) * 100 : 0;

  // We exclude Capital Inicial from allocations completely, since it's just the base accounting reference.
  const adjustedAssetStats = assetStats.map(s => {
    if (cashAssets.some(ca => ca.ticker === s.ticker)) {
      return { ...s, currentValue: capitalInicial, invested: capitalInicial };
    }
    return s;
  }).filter(s => !cashAssets.some(ca => ca.ticker === s.ticker)); // Exclude from lists

  // Allocation by Tipo
  const tipoTotals: Record<string, number> = {};
  assets.forEach(a => {
    // Only include in chart if it exists in adjustedAssetStats (which excludes Capital)
    const s = adjustedAssetStats.find(stat => stat.ticker === a.ticker);
    if (s) {
      const key = a.tipo || 'Otros';
      tipoTotals[key] = (tipoTotals[key] || 0) + s.currentValue;
    }
  });

  const allocation = Object.entries(tipoTotals)
    .map(([name, value]) => ({ 
      name, 
      value: totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(1)) : 0 
    }))
    .sort((a, b) => b.value - a.value);

  // Allocation by Asset (Individual)
  const allAssetAllocation = adjustedAssetStats
    .filter(s => Math.abs(s.currentValue) > 0.01)
    .map(s => ({
      name: s.name, 
      value: totalValue > 0 ? Number(((s.currentValue / totalValue) * 100).toFixed(1)) : 0,
      type: assets.find(a => a.ticker === s.ticker)?.tipo
    }))
    .sort((a, b) => b.value - a.value);

  const bestAsset = [...nonCashStats]
    .filter(s => s.currentValue > 1)
    .sort((a, b) => b.pnlPercent - a.pnlPercent)[0] || null;

  // We keep Capital Inicial inside allPositions so it shows up in the table
  const allPositions = assetStats.map(s => {
    if (cashAssets.some(ca => ca.ticker === s.ticker)) {
      return { ...s, currentValue: capitalInicial, invested: capitalInicial };
    }
    return s;
  })
    .filter(s => Math.abs(s.currentValue) > 0.01) 
    .sort((a, b) => b.currentValue - a.currentValue);

  const topPositions = allPositions.slice(0, 5);

  return {
    totalValue,
    totalInvested,
    totalPnL,
    totalPnLPercent,
    capitalInicial,
    allocation,
    assetAllocation: allAssetAllocation,
    performanceData,
    bestAsset,
    topPositions,
    allPositions,
    allAssetAllocation
  };
}
