
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Proxy route for Société Générale API to bypass CORS restrictions
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  const code = searchParams.get('code');
  const productId = searchParams.get('productId');

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  let targetUrl = '';
  const BASE_URL = 'https://bolsa.societegenerale.es/EmcWebApi/api';

  if (endpoint === 'Products' && code) {
    targetUrl = `${BASE_URL}/Products?code=${code}`;
  } else if (endpoint === 'Live' && productId) {
    targetUrl = `${BASE_URL}/Prices/Live?productId=${productId}`;
  } else if (endpoint === 'History' && productId) {
    targetUrl = `${BASE_URL}/Prices/History?productId=${productId}`;
  } else {
    return NextResponse.json({ error: 'Invalid endpoint parameters' }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: `SG API responded with ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
