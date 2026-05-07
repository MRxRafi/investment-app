import { supabase } from './supabase';

/**
 * Société Générale Financial Products API Wrapper
 * This module fetches real-time and historical data for Turbo warrants and other derivatives
 * using Supabase Edge Functions.
 */

export interface SGPrice {
  price: number;
  bid: number;
  ask: number;
  date: string;
  currency: string;
}

export interface SGHistoryPoint {
  date: Date;
  close: number;
  bid: number;
  ask: number;
}

/**
 * Helper to determine if a ticker belongs to Société Générale
 */
export function isSGTicker(ticker: string): boolean {
  const t = ticker?.toUpperCase() || "";
  return (t.length === 6 && /^[A-Z0-9]+$/.test(t)) || t.startsWith('DE000SW') || t.startsWith('FR00');
}

/**
 * Fetches the latest live price for a product via Supabase Edge Function
 */
export async function getSGPrice(ticker: string): Promise<SGPrice | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-finance-data', {
      body: { operation: 'price', ticker }
    });

    if (error || !data?.data) return null;
    const res = data.data;

    return {
      price: res.regularMarketPrice,
      bid: res.regularMarketPrice,
      ask: res.regularMarketPrice,
      date: new Date().toISOString(),
      currency: res.currency || 'EUR'
    };
  } catch (error) {
    console.error(`Error fetching SG price for ${ticker}:`, error);
    return null;
  }
}

/**
 * Fetches daily historical prices via Supabase Edge Function
 */
export async function getSGHistory(ticker: string): Promise<SGHistoryPoint[]> {
  try {
    const { data, error } = await supabase.functions.invoke('get-finance-data', {
      body: { operation: 'history', ticker, days: 365 }
    });

    if (error || !data?.data?.chart?.result?.[0]) return [];
    
    const result = data.data.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];

    return timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000),
      close: quotes.close[i],
      bid: quotes.close[i],
      ask: quotes.close[i]
    }));
  } catch (error) {
    console.error(`Error fetching SG history for ${ticker}:`, error);
    return [];
  }
}

/**
 * Searches for products via Supabase Edge Function
 */
export async function searchSGProducts(query: string): Promise<any[]> {
  if (query.length < 3) return [];
  try {
    const { data, error } = await supabase.functions.invoke('get-finance-data', {
      body: { operation: 'search', query }
    });

    if (error || !data?.data?.quotes) return [];
    
    // Filter only SG products from the unified search
    return data.data.quotes.filter((q: any) => q.exchange === 'Société Générale').map((q: any) => ({
      ticker: q.symbol,
      name: q.shortname || q.longname,
      exchange: "Société Générale",
      quoteType: "DERIVATIVE"
    }));
  } catch (error) {
    console.error(`Error searching SG products for ${query}:`, error);
    return [];
  }
}
