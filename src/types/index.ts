export type AssetType = 'Stock' | 'ETF' | 'Fund' | 'Crypto' | 'Cash';
export type TransactionType = 'Buy' | 'Sell' | 'Dividend' | 'Deposit' | 'Withdrawal';

export interface Asset {
  id: string;
  name: string;
  ticker?: string;
  isin?: string;
  asset_type: AssetType;
  sector?: string;
  country?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  asset_id: string;
  transaction_type: TransactionType;
  quantity: number;
  price_per_unit: number;
  fee: number;
  transaction_date: string;
  currency: string;
  notes?: string;
}

export interface PortfolioPosition {
  asset: Asset;
  quantity: number;
  average_price: number;
  current_price?: number;
  total_invested: number;
  current_value?: number;
  pnl?: number;
  pnl_percent?: number;
}
