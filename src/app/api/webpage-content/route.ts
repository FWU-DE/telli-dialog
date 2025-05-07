import { NextResponse } from 'next/server';
import { webScraperExecutable } from '../conversation/tools/websearch/search-web';
import { getUser } from '@/auth/utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  await getUser()
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const content = await webScraperExecutable(url);

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching webpage metadata:', error);
    return NextResponse.json({ error: 'Failed to fetch webpage metadata' }, { status: 500 });
  }
} 