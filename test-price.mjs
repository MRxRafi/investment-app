import yahooFinance from 'yahoo-finance2';

async function test() {
  const ticker = 'NVDA';
  console.log(`Testing price for ${ticker}...`);
  try {
    const result = await yahooFinance.quote(ticker);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
