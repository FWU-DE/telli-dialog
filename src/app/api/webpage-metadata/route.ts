import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Page';

    // Extract preview image (og:image or first image)
    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i);
    const image = ogImageMatch ? ogImageMatch[1] : null;

    return NextResponse.json({ title, image });
  } catch (error) {
    console.error('Error fetching webpage metadata:', error);
    return NextResponse.json({ error: 'Failed to fetch webpage metadata' }, { status: 500 });
  }
} 