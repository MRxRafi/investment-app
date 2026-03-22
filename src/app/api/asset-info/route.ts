import { NextResponse } from 'next/server';
import { getAssetInfo } from '@/lib/yahoo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    const assetInfo = await getAssetInfo(ticker);
    if (!assetInfo) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    return NextResponse.json(assetInfo);
  } catch (error) {
    console.error(`Error in asset-info API for ${ticker}:`, error);
    return NextResponse.json({ error: 'Failed to fetch asset info' }, { status: 500 });
  }
}
