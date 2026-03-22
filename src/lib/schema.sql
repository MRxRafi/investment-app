-- Database Schema for Portfolio Tracker

-- Assets Table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ticker TEXT UNIQUE,
    isin TEXT,
    tipo TEXT NOT NULL,
    sector TEXT,
    country TEXT,
    current_price NUMERIC DEFAULT 0,
    last_price_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Buy', 'Sell', 'Dividend', 'Deposit', 'Withdrawal')),
    quantity DECIMAL(20, 10) NOT NULL DEFAULT 0,
    price_per_unit DECIMAL(20, 10) NOT NULL DEFAULT 0,
    fee DECIMAL(20, 10) DEFAULT 0,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    currency TEXT NOT NULL DEFAULT 'EUR',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices/Benchmarks Cache
CREATE TABLE IF NOT EXISTS benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker TEXT NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(20, 10) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    UNIQUE(ticker, recorded_at)
);

-- Portfolio Daily Snapshots (for performance tracking)
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    total_value DECIMAL(20, 10) NOT NULL,
    total_invested DECIMAL(20, 10) NOT NULL,
    liquidity DECIMAL(20, 10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
