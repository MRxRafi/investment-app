import { supabase } from './supabase';

export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;
  const pair = `${from}${to}=X`;
  try {
    const { data, error } = await supabase.functions.invoke('get-finance-data', {
      body: { operation: 'price', ticker: pair }
    });

    if (error || !data?.data) {
      return 1;
    }
    
    return data.data.regularMarketPrice || 1;
  } catch (error) {
    return 1;
  }
}

export async function getPrice(ticker: string) {
  try {
    const { data, error } = await supabase.functions.invoke('get-finance-data', {
      body: { operation: 'price', ticker }
    });

    if (error || !data?.data) return null;

    const result = data.data;
    let price = result.price || result.regularMarketPrice;
    const currency = result.currency;

    if (currency && currency !== "EUR") {
      const rate = await getExchangeRate(currency, "EUR");
      price = price * rate;
    }

    return {
      price,
      currency: "EUR",
      originalCurrency: currency,
      name: result.name || ticker,
      change: result.regularMarketChange || 0,
      changePercent: result.regularMarketChangePercent || 0
    };
  } catch (error) {
    console.error(`Error for ${ticker}:`, error);
    return null;
  }
}

export async function searchTickers(query: string, source?: 'yahoo' | 'sg') {
  if (!query || query.length < 2) return [];

  try {
    const { data, error } = await supabase.functions.invoke('get-finance-data', {
      body: { operation: 'search', query, source }
    });

    if (error || !data?.data?.quotes) return [];

    return data.data.quotes.map((quote: any) => ({
      ticker: quote.symbol || quote.ticker,
      name: quote.shortname || quote.longname || quote.name,
      exchange: quote.exchange,
      quoteType: quote.quoteType || 'EQUITY'
    }));
  } catch (error) {
    console.error(`Error searching tickers for ${query}:`, error);
    return [];
  }
}

export async function getAssetInfo(ticker: string, source?: 'yahoo' | 'sg'): Promise<any> {
  try {
    const { data, error } = await supabase.functions.invoke('get-finance-data', {
      body: { operation: 'asset-info', ticker, source }
    });

    if (error || !data?.data) return null;

    const result = data.data;
    let price = result.price || result.regularMarketPrice;
    const currency = result.currency || 'EUR';

    if (currency && currency !== "EUR") {
      const rate = await getExchangeRate(currency, "EUR");
      price = price * rate;
    }

    return {
      ticker: result.ticker || result.symbol,
      name: result.name || result.ticker || result.symbol,
      price: price,
      currency: "EUR",
      exchange: result.exchange,
      quoteType: result.quoteType || "EQUITY"
    };
  } catch (error) {
    console.error(`Error fetching asset info for ${ticker}:`, error);
    return null;
  }
}

export async function getHistory(ticker: string, period1: Date, period2: Date) {
  try {
    const days = Math.ceil((period2.getTime() - period1.getTime()) / (1000 * 60 * 60 * 24));
    const { data, error } = await supabase.functions.invoke('get-finance-data', {
      body: { operation: 'history', ticker, days }
    });

    if (error || !data?.data?.chart?.result?.[0]) return [];

    const result = data.data.chart.result[0];
    const timestamps = result.timestamp || [];
    const quotes = result.indicators.quote[0];
    const adjClose = result.indicators.adjclose?.[0]?.adjclose || quotes.close;

    if (!timestamps.length) return [];

    return timestamps.map((ts: number, i: number) => ({
        date: new Date(ts * 1000),
        close: quotes.close[i],
        high: quotes.high[i],
        low: quotes.low[i],
        open: quotes.open[i],
        volume: quotes.volume[i],
        adjClose: adjClose[i] || quotes.close[i]
    })).filter((item: any) => item && item.date && item.close !== null && item.close !== undefined);

  } catch (error) {
    console.error(`Error fetching history for ${ticker}:`, error);
    return [];
  }
}
