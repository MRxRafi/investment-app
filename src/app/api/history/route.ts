import { NextResponse } from 'next/server';
import { getHistory } from '@/lib/yahoo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const days = parseInt(searchParams.get('days') || '365');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    const period2 = new Date();
    const period1 = new Date();
    period1.setDate(period1.getDate() - days);

    const history = await getHistory(ticker, period1, period2);
    return NextResponse.json(history);
  } catch (error) {
    console.error(`Error in history API for ${ticker}:`, error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
