import { NextResponse } from 'next/server';
import { getUser } from '@/auth/utils';
import { webScraper } from './search-web';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  await getUser();
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const result = await webScraper(url);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error fetching webpage content for URL: ${url}`, error);
    return NextResponse.json({ error: 'Failed to fetch webpage content' }, { status: 500 });
  }
}
