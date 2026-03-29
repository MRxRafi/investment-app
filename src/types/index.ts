export interface Asset {
  id: string;
  name: string;
  ticker: string;
  current_price?: number;
  tipo: string;
}

export interface Transaction {
  id: string;
  asset_id: string;
  transaction_type: TransactionType;
  quantity: number;
  price_per_unit: number;
  fee: number;
  transaction_date: string;
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
  assetAllocation: { name: string; value: number; type?: string }[];
  performanceData: PerformancePoint[];
  bestAsset: AssetStats | null;
  topPositions: AssetStats[];
  allPositions: AssetStats[];
  allAssetAllocation: { name: string; value: number; type?: string }[];
}

export type TransactionType = 'Buy' | 'Sell' | 'Dividend' | 'Deposit' | 'Withdrawal';
export type AssetType = 'Stock' | 'Crypto' | 'Etf' | 'Commodity' | 'Other';

export interface PerformancePoint {
  date: string;
  value: number;
  benchmark: number;
}
