import { Asset, Transaction, AssetStats, DashboardStats, PerformancePoint } from '@/types';

export function calculateAssetStats(assets: Asset[], transactions: Transaction[], currentPrices: Record<string, number>): AssetStats[] {
  // Pre-group transactions by asset_id for O(1) lookup during mapping
  const txByAsset = new Map<string, Transaction[]>();

  // MUST SORT TRANSACTIONS BY DATE for chronological processing
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedTransactions.forEach(t => {
    if (!txByAsset.has(t.assetId)) txByAsset.set(t.assetId, []);
    txByAsset.get(t.assetId)!.push(t);
  });

  return assets.map(asset => {
    const assetTx = txByAsset.get(asset.id) || [];

    let qty = 0;
    let costBasis = 0;
    let realizedPnL = 0;

    assetTx.forEach(t => {
      const q = Number(t.quantity);
      const p = Number(t.pricePerUnit);
      const f = Number(t.fee || 0);

      if (t.type === 'Buy' || t.type === 'Deposit') {
        qty += q;
        costBasis += (q * p) + f;
      } else if (t.type === 'Sell' || t.type === 'Withdrawal') {
        if (qty > 0) {
          const avgCost = costBasis / qty;
          const costOfSold = q * avgCost;
          realizedPnL += (q * p - f) - costOfSold;
          qty -= q;
          costBasis -= costOfSold;
        } else {
          // Fallback if there are sales without buys recorded properly
          qty -= q;
          costBasis -= (q * p) - f;
        }
      } else if (t.type === 'Dividend') {
        // Dividends do not reduce cost basis of the asset, they are pure realized profit
        realizedPnL += (q * p);
      }
    });

    // Safety check for floating point precision issues near zero
    if (qty < 0.000001) {
      qty = 0;
      costBasis = 0;
    }

    const isStaticValue = asset.category === 'Capital' || asset.category === 'Debt' || asset.category === 'Deuda';
    const currentPrice = isStaticValue ? 1.0 : (currentPrices[asset.ticker] || Number(asset.currentPrice || 0));

    // For Static assets like Cash/Debt, their value is strictly the net cash flow (invested)
    const currentValue = isStaticValue ? costBasis : qty * currentPrice;

    // For regular assets, Unrealized PnL is Value - Invested
    // For Static assets like Cash/Debt, Unrealized PnL is 0
    const unrealizedPnL = isStaticValue ? 0 : currentValue - costBasis;
    const unrealizedPnLPercent = (!isStaticValue && costBasis !== 0) ? (unrealizedPnL / costBasis) * 100 : 0;
    const totalPnL = realizedPnL + unrealizedPnL;

    const averageCost = qty > 0 ? costBasis / qty : 0;

    return {
      name: asset.name,
      ticker: asset.ticker,
      invested: costBasis,
      quantity: qty,
      currentPrice,
      currentValue,
      pnl: unrealizedPnL, // UI binds to pnl for Latente as requested
      pnlPercent: unrealizedPnLPercent, // UI binds to pnlPercent for Latente
      realizedPnL,
      unrealizedPnL,
      unrealizedPnLPercent,
      totalPnL,
      averageCost
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
  // totalDeposits = Sum of ALL user deposits over time (initial + monthly contributions).
  // This is NOT "free cash" — it's the total money ever injected into the brokerage.
  const totalDeposits = capitalStats.reduce((acc, s) => acc + s.invested, 0);

  // adjustedAssetStats excludes the "Capital" asset itself from composition lists
  const adjustedAssetStats = assetStats.filter(s => {
    const a = assets.find(asset => asset.ticker === s.ticker);
    return a && a.category !== 'Capital';
  });

  // Rentabilidad Total = Suma de todos los Beneficios Totales (Realizados + Latentes)
  const lastPerfPoint = performanceData && performanceData.length > 0 ? performanceData[performanceData.length - 1] : null;
  const totalValue = lastPerfPoint?.absValue ?? assetStats.reduce((acc, s) => acc + s.currentValue, 0);
  const totalPnL = totalValue - totalDeposits;

  // Total Invested is the sum of cost basis of currently open Non-Capital assets
  const totalInvested = adjustedAssetStats.reduce((acc, s) => acc + s.invested, 0);

  // Rendimiento porcentual sobre el total aportado (totalDeposits)
  const baseForPercentage = totalDeposits > 0 ? totalDeposits : (totalInvested > 0 ? totalInvested : 1);
  const totalPnLPercent = (totalPnL / baseForPercentage) * 100;

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
    capitalInicial: totalDeposits, // UI field name kept for compatibility
    allocation,
    assetAllocation,
    performanceData,
    bestAsset,
    topPositions,
    allPositions: adjustedAssetStats.filter(s => Math.abs(s.currentValue) > 0.01),
    allAssetAllocation: assetAllocation.filter(s => Math.abs(s.value) > 0.01)

  };
}

export function generatePerformanceData(
  assets: Asset[],
  transactions: Transaction[],
  assetHistories: Record<string, { date: string | Date, close: number }[]>,
  benchmarkHistory: { date: string | Date, close: number }[]
): PerformancePoint[] {
  if (!benchmarkHistory || benchmarkHistory.length === 0) return [];

  // Sort transactions and benchmark history chronologically
  // Deduplicate transactions by ID to prevent double-counting if they arrive multiple times
  const uniqueTx = Array.from(new Map(transactions.map(tx => [tx.id, tx])).values());
  const sortedTx = uniqueTx.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedBenchmark = [...benchmarkHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let txIndex = 0;

  // 1. Initial State
  let cashBalance = 0;
  const inventory = new Map<string, { qty: number, costBasis: number }>();
  let shadowBenchmarkUnits = 0;

  // TWR Logic State
  let portfolioIndex = 100;
  let benchmarkIndex = 100;
  let prevPortfolioValue = 0;
  let prevBenchmarkPrice = 0;

  // Build a fast lookup for historical prices: dailyPrices[ticker][dateString] = price
  const dailyPrices = new Map<string, Map<string, number>>();
  Object.entries(assetHistories).forEach(([ticker, history]) => {
    const map = new Map<string, number>();
    history.forEach(h => {
      map.set(new Date(h.date).toISOString().split('T')[0], h.close);
    });
    dailyPrices.set(ticker, map);
  });

  const lastKnownPrices = new Map<string, number>();
  const performancePoints: PerformancePoint[] = [];

  for (const bDay of sortedBenchmark) {
    const dayDateStr = new Date(bDay.date).toISOString().split('T')[0];
    const bPrice = bDay.close;

    if (!bPrice || bPrice < 0.001) continue;

    // 1. Calculate Portfolio Market Value (Start of Day)
    let portfolioMarketValue = 0;
    inventory.forEach((inv, assetId) => {
      const asset = assets.find(a => a.id === assetId);
      if (!asset || asset.category?.toLowerCase() === 'capital' || inv.qty <= 0) return;

      const isStatic = asset.category?.toLowerCase() === 'debt' || asset.category?.toLowerCase() === 'deuda';
      let price = 0;

      if (isStatic) {
        price = inv.costBasis / inv.qty;
      } else {
        const dayPrice = dailyPrices.get(asset.ticker)?.get(dayDateStr);
        if (dayPrice !== undefined && dayPrice > 0) {
          lastKnownPrices.set(asset.ticker, dayPrice);
          price = dayPrice;
        } else {
          price = lastKnownPrices.get(asset.ticker) || 0;
        }
      }
      portfolioMarketValue += inv.qty * price;
    });

    const currentPortfolioValue = portfolioMarketValue + cashBalance;

    // 2. Update Indices (TWR)
    // Only update if we have a valid baseline and money in the portfolio
    if (prevPortfolioValue > 0) {
      const dailyReturn = (currentPortfolioValue / prevPortfolioValue) - 1;
      if (!isNaN(dailyReturn) && isFinite(dailyReturn)) {
        portfolioIndex *= (1 + dailyReturn);
      }
    }

    if (prevBenchmarkPrice > 0) {
      const bReturn = (bPrice / prevBenchmarkPrice) - 1;
      if (!isNaN(bReturn) && isFinite(bReturn)) {
        benchmarkIndex *= (1 + bReturn);
      }
    }

    // 3. Process Today's Transactions
    while (txIndex < sortedTx.length) {
      const tx = sortedTx[txIndex];
      const txDateStr = new Date(tx.date).toISOString().split('T')[0];
      if (txDateStr > dayDateStr) break;

      const q = Math.abs(tx.quantity);
      const p = tx.pricePerUnit;
      const f = tx.fee || 0;
      const asset = assets.find(a => a.id === tx.assetId);
      const isCapital = asset?.category?.toLowerCase() === 'capital';

      if (isCapital) {
        if (tx.type === 'Buy' || tx.type === 'Deposit') {
          cashBalance += (q * p);
        } else if (tx.type === 'Withdrawal' || tx.type === 'Sell') {
          cashBalance -= (q * p);
        }
      } else if (asset) {
        const inv = inventory.get(asset.id) || { qty: 0, costBasis: 0 };
        if (tx.type === 'Buy') {
          inv.qty += q;
          inv.costBasis += (q * p);
          cashBalance -= (q * p) + f;
          if (lastKnownPrices.get(asset.ticker) === undefined || lastKnownPrices.get(asset.ticker) === 0) {
            lastKnownPrices.set(asset.ticker, p);
          }
        } else if (tx.type === 'Sell') {
          const sellRatio = q / inv.qty;
          inv.costBasis -= (inv.costBasis * sellRatio);
          inv.qty -= q;
          cashBalance += (q * p) - f;
        } else if (tx.type === 'Dividend') {
          cashBalance += (q * p) - f;
        }
        inventory.set(asset.id, inv);
      }
      txIndex++;
    }

    // 4. Set End-of-Day Baseline for Tomorrow
    let portfolioMarketValueAfterTx = 0;
    inventory.forEach((inv, assetId) => {
      const asset = assets.find(a => a.id === assetId);
      if (!asset || asset.category?.toLowerCase() === 'capital' || inv.qty <= 0) return;

      const isStatic = asset.category?.toLowerCase() === 'debt' || asset.category?.toLowerCase() === 'deuda';
      const price = isStatic ? (inv.costBasis / inv.qty) : (lastKnownPrices.get(asset.ticker) || 0);
      portfolioMarketValueAfterTx += inv.qty * price;
    });

    prevPortfolioValue = portfolioMarketValueAfterTx + cashBalance;
    prevBenchmarkPrice = bPrice;

    // Initial stabilization: keep index at 100 until there's money
    if (prevPortfolioValue <= 0) {
      portfolioIndex = 100;
    }

    performancePoints.push({
      date: dayDateStr,
      value: portfolioIndex,
      benchmark: benchmarkIndex,
      absValue: Math.round(prevPortfolioValue),
      absBenchmark: Math.round(10000 * (benchmarkIndex / 100)) // Use a normalized 10k baseline for benchmark comparison
    });
  }

  return performancePoints;
}
