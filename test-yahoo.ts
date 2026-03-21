import yahooFinance from 'yahoo-finance2';

async function test() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await yahooFinance.quote('AAPL');
    console.log('Price:', result.regularMarketPrice);
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
