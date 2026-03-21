import { NextResponse } from 'next/server';
import { getPrice } from '@/lib/yahoo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    const priceData = await getPrice(ticker);
    return NextResponse.json(priceData);
  } catch (error) {
    console.error(`Error in price API for ${ticker}:`, error);
    return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 });
  }
}
