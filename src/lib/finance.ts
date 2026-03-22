import { Asset, Transaction, AssetStats, DashboardStats, PerformancePoint } from '@/types';

export function calculateAssetStats(assets: Asset[], transactions: Transaction[], currentPrices: Record<string, number>): AssetStats[] {
  return assets.map(asset => {
    const assetTx = transactions.filter(t => t.asset_id === asset.id);
    
    let qty = 0;
    let invested = 0;
    
    assetTx.forEach(t => {
      const q = Number(t.quantity);
      const p = Number(t.price_per_unit);
      const f = Number(t.fee || 0);
      
      if (t.transaction_type === 'Buy') {
        qty += q;
        invested += (q * p) + f;
      } else if (t.transaction_type === 'Sell') {
        qty -= q;
        invested -= (q * p) - f;
      }
    });

    const currentPrice = asset.tipo === 'Liquidez' ? 1.0 : (currentPrices[asset.ticker] || Number(asset.current_price || 0));
    const currentValue = qty * currentPrice;
    const pnl = currentValue - invested;
    const pnlPercent = invested !== 0 ? (pnl / invested) * 100 : 0;

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
  const totalValue = assetStats.reduce((acc, s) => acc + s.currentValue, 0);
  const totalInvested = assetStats.reduce((acc, s) => acc + s.invested, 0);
  const totalPnL = totalValue - totalInvested;
  const totalPnLPercent = totalInvested !== 0 ? (totalPnL / totalInvested) * 100 : 0;

  const liquidity = assetStats
    .filter(s => assets.find(a => s.ticker === a.ticker)?.tipo === 'Liquidez')
    .reduce((acc, s) => acc + s.currentValue, 0);

  // Allocation by Tipo
  const tipoTotals: Record<string, number> = {};
  assets.forEach(a => {
    const s = assetStats.find(stat => stat.ticker === a.ticker);
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
  const allAssetAllocation = assetStats
    .filter(s => s.currentValue > 1)
    .map(s => ({
      name: s.name, 
      value: totalValue > 0 ? Number(((s.currentValue / totalValue) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.value - a.value);

  const assetAllocation = allAssetAllocation.slice(0, 8);

  const bestAsset = [...assetStats]
    .filter(s => s.currentValue > 1)
    .sort((a, b) => b.pnlPercent - a.pnlPercent)[0] || null;

  const allPositions = assetStats
    .filter(s => s.currentValue > 1) 
    .sort((a, b) => b.currentValue - a.currentValue);

  const topPositions = allPositions.slice(0, 5);

  return {
    totalValue,
    totalInvested,
    totalPnL,
    totalPnLPercent,
    liquidity,
    allocation,
    assetAllocation,
    performanceData,
    bestAsset,
    topPositions,
    allPositions,
    allAssetAllocation
  };
}
