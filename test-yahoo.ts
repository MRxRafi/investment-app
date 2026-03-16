import yahooFinance from 'yahoo-finance2';

async function test() {
  try {
    const result = await yahooFinance.quote('AAPL');
    console.log('Price:', result.regularMarketPrice);
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
