import yahooFinance from 'yahoo-finance2';

export async function getPrice(ticker: string) {
  try {
    const result = await yahooFinance.quote(ticker);
    return {
      price: result.regularMarketPrice,
      currency: result.currency,
      change: result.regularMarketChange,
      changePercent: result.regularMarketChangePercent
    };
  } catch (error) {
    console.error(`Error fetching price for ${ticker}:`, error);
    return null;
  }
}

export async function getHistory(ticker: string, period1: Date, period2: Date) {
  try {
    const result = await yahooFinance.historical(ticker, {
      period1: period1,
      period2: period2,
      interval: '1d'
    });
    return result;
  } catch (error) {
    console.error(`Error fetching history for ${ticker}:`, error);
    return [];
  }
}
