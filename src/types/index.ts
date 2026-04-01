export interface Asset {
  id: string;
  name: string;
  ticker: string;
  currentPrice?: number;
  category: string;
}

export interface Transaction {
  id: string;
  assetId: string;
  type: TransactionType;
  quantity: number;
  pricePerUnit: number;
  fee: number;
  date: string;
  assets?: {
    name: string;
    ticker: string;
  };
}

export interface AssetStats {
  name: string;
  ticker: string;
  invested: number;
  quantity: number;
  currentPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface DashboardStats {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercent: number;
  capitalInicial: number;
  allocation: { name: string; value: number }[];
  assetAllocation: { name: string; value: number; category?: string }[];
  performanceData: PerformancePoint[];
  bestAsset: AssetStats | null;
  topPositions: AssetStats[];
  allPositions: AssetStats[];
  allAssetAllocation: { name: string; value: number; category?: string }[];
}

export type TransactionType = 'Buy' | 'Sell' | 'Dividend' | 'Deposit' | 'Withdrawal';
export type AssetType = 'Stock' | 'Crypto' | 'Etf' | 'Commodity' | 'Other';

export interface PerformancePoint {
  date: string;
  value: number;
  benchmark: number;
}
