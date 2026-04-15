import { Asset, Transaction, AssetStats, DashboardStats, PerformancePoint } from '@/types';

export function calculateAssetStats(assets: Asset[], transactions: Transaction[], currentPrices: Record<string, number>): AssetStats[] {
  // Pre-group transactions by asset_id for O(1) lookup during mapping
  const txByAsset = new Map<string, Transaction[]>();
  transactions.forEach(t => {
    if (!txByAsset.has(t.assetId)) txByAsset.set(t.assetId, []);
    txByAsset.get(t.assetId)!.push(t);
  });

  return assets.map(asset => {
    const assetTx = txByAsset.get(asset.id) || [];

    let qty = 0;
    let invested = 0;

    assetTx.forEach(t => {
      const q = Number(t.quantity);
      const p = Number(t.pricePerUnit);
      const f = Number(t.fee || 0);

      if (t.type === 'Buy' || t.type === 'Deposit') {
        qty += q;
        invested += (q * p) + f;
      } else if (t.type === 'Sell' || t.type === 'Withdrawal') {
        qty -= q;
        invested -= (q * p) - f;
      } else if (t.type === 'Dividend') {
        // Dividends reduce the net invested amount in the asset (cash coming back)
        invested -= (q * p);
      }
    });

    const isStaticValue = asset.category === 'Capital' || asset.category === 'Debt' || asset.category === 'Deuda';
    const currentPrice = isStaticValue ? 1.0 : (currentPrices[asset.ticker] || Number(asset.currentPrice || 0));

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
  // 1. Identify Assets by Role
  const capitalStats = assetStats.filter(s => {
    const a = assets.find(asset => asset.ticker === s.ticker);
    return a && a.category === 'Capital';
  });

  const debtStats = assetStats.filter(s => {
    const a = assets.find(asset => asset.ticker === s.ticker);
    return a && (a.category === 'Debt' || a.category === 'Deuda');
  });

  const marketStats = assetStats.filter(s => {
    const a = assets.find(asset => asset.ticker === s.ticker);
    return a && a.category !== 'Capital' && a.category !== 'Debt' && a.category !== 'Deuda';
  });

  // 2. Calculate Dashboard Summary Stats
  // Capital Inicial (Manual) represents the Total Deposits/Inflow recorded by the user
  const capitalInicial = capitalStats.reduce((acc, s) => acc + s.invested, 0);

  // adjustedAssetStats excludes the "Capital" asset itself from composition lists
  const adjustedAssetStats = assetStats.filter(s => {
    const a = assets.find(asset => asset.ticker === s.ticker);
    return a && a.category !== 'Capital';
  });

  // Patrimonio Total reflects the sum of all assets + debt (without Capital)
  const totalValue = adjustedAssetStats.reduce((acc, s) => acc + s.currentValue, 0);
  // Total Invested is the sum of cash injected into the Non-Capital assets
  const totalInvested = adjustedAssetStats.reduce((acc, s) => acc + s.invested, 0);
  
  // Rentabilidad solicitada: Patrimonio Total - Capital Inicial
  const totalPnL = totalValue - capitalInicial;
  
  // Rendimiento porcentual contra el Capital Inicial (la inyección base de la cartera)
  const totalPnLPercent = capitalInicial !== 0 ? (totalPnL / capitalInicial) * 100 : 0;

  // 4b. Filter for Charts (Exclude Debt and Capital)
  const chartStats = adjustedAssetStats.filter(s => {
    const a = assets.find(asset => asset.ticker === s.ticker);
    return a && a.category !== 'Debt' && a.category !== 'Capital';
  });
  const chartTotalValue = chartStats.reduce((acc, s) => acc + s.currentValue, 0);

  // Allocation by Tipo (Category)
  const tipoTotals: Record<string, number> = {};
  chartStats.forEach(s => {
    const a = assets.find(asset => asset.ticker === s.ticker);
    const key = a?.category || 'Otros';
    tipoTotals[key] = (tipoTotals[key] || 0) + s.currentValue;
  });

  const allocation = Object.entries(tipoTotals)
    .map(([name, value]) => ({
      name,
      value: chartTotalValue > 0 ? Number(((value / chartTotalValue) * 100).toFixed(1)) : 0,
      category: name // For color mapping, the name is the category here
    }))
    .sort((a, b) => b.value - a.value);

  // Allocation by Asset (Individual)
  const assetAllocation = chartStats
    .map(s => ({
      name: s.name,
      value: chartTotalValue > 0 ? Number(((s.currentValue / chartTotalValue) * 100).toFixed(1)) : 0,
      category: assets.find(a => a.ticker === s.ticker)?.category
    }))
    .sort((a, b) => b.value - a.value);

  const bestAsset = [...marketStats]
    .filter(s => s.currentValue > 1)
    .sort((a, b) => b.pnlPercent - a.pnlPercent)[0] || null;

  // Filter out Capital and Debt from top positions as requested
  const topPositions = adjustedAssetStats
    .filter(s => {
      const a = assets.find(asset => asset.ticker === s.ticker);
      const isCapital = s.name.toLowerCase().includes('capital inicial') || a?.category === 'Capital';
      const isDebt = a?.category === 'Debt';
      return !isCapital && !isDebt;
    })
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 8); 


  return {
    totalValue,
    totalInvested,
    totalPnL,
    totalPnLPercent,
    capitalInicial,
    allocation,
    assetAllocation,
    performanceData,
    bestAsset,
    topPositions,
    allPositions: adjustedAssetStats.filter(s => Math.abs(s.currentValue) > 0.01),
    allAssetAllocation: assetAllocation.filter(s => Math.abs(s.value) > 0.01)

  };
}
