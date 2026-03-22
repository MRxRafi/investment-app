import { NextResponse } from 'next/server';
import { searchTickers } from '@/lib/yahoo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const results = await searchTickers(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error(`Error in search API for ${query}:`, error);
    return NextResponse.json({ error: 'Failed to search tickers' }, { status: 500 });
  }
}
