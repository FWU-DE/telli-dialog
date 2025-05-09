import { NextResponse } from 'next/server';
import { webScraperExecutable } from '../conversation/tools/websearch/search-web';
import { getUser } from '@/auth/utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  await getUser();
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const result = await webScraperExecutable(url);
    console.log('result', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching webpage content:', error);
    return NextResponse.json({ error: 'Failed to fetch webpage content' }, { status: 500 });
  }
}
