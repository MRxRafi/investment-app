import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;
  const pair = `${from}${to}=X`;
  try {
    const result: any = await yahooFinance.quote(pair);
    return result?.regularMarketPrice || 1;
  } catch (error) {
    console.warn(`Could not fetch exchange rate for ${pair}, using 1:`, error);
    return 1;
  }
}

export async function getPrice(ticker: string) {
  try {
    const result: any = await yahooFinance.quote(ticker);
    if (!result) {
      console.warn(`No price data found for ${ticker}`);
      return null;
    }

    let price = result.regularMarketPrice;
    const currency = result.currency;

    if (currency && currency !== "EUR") {
      const rate = await getExchangeRate(currency, "EUR");
      price = price * rate;
    }

    return {
      price,
      currency: "EUR", // We always return EUR now
      originalCurrency: currency,
      name: result.longName || result.shortName || ticker,
      change: result.regularMarketChange,
      changePercent: result.regularMarketChangePercent
    };
  } catch (error) {
    console.error(`YAHOO_ERROR for ${ticker}:`, error);
    return null;
  }
}

export async function getAssetInfo(ticker: string) {
  try {
    const result: any = await yahooFinance.quote(ticker);
    if (!result) return null;

    let price = result.regularMarketPrice;
    const currency = result.currency;

    if (currency && currency !== "EUR") {
      const rate = await getExchangeRate(currency, "EUR");
      price = price * rate;
    }

    return {
      ticker: result.symbol,
      name: result.longName || result.shortName || result.symbol,
      price: price,
      currency: "EUR",
      exchange: result.fullExchangeName,
      quoteType: result.quoteType
    };
  } catch (error) {
    console.error(`Error fetching asset info for ${ticker}:`, error);
    return null;
  }
}

export async function getHistory(ticker: string, period1: Date, period2: Date) {
  try {
    const result = await yahooFinance.chart(ticker, {
      period1: period1,
      period2: period2,
      interval: '1d'
    });

    if (!result || !result.quotes) return [];

    // Filter out rows that have null date or close price and map to match historical format
    return result.quotes
      .filter((item: any) => item && item.date && item.close !== null && item.close !== undefined)
      .map((item: any) => ({
        date: item.date,
        close: item.close,
        high: item.high,
        low: item.low,
        open: item.open,
        volume: item.volume,
        adjClose: item.adjclose || item.close
      }));
  } catch (error) {
    console.error(`Error fetching history for ${ticker}:`, error);
    return [];
  }
}

export async function searchTickers(query: string) {
  try {
    const result = await yahooFinance.search(query, {
      newsCount: 0,
      quotesCount: 10
    });
    return result.quotes.map(quote => ({
      ticker: quote.symbol,
      name: (quote as any).longname || (quote as any).shortname || quote.symbol,
      exchange: quote.exchange,
      quoteType: quote.quoteType,
      index: quote.index
    }));
  } catch (error) {
    console.error(`Error searching tickers for ${query}:`, error);
    return [];
  }
}
