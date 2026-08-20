import { getUser } from '@/auth/utils';
import { handleErrorInRoute } from '@/error/handle-error-in-route';
import { createScaledImage } from '@/app/api/file-operations/scaled-image-service';
import { dbVerifyFileOwnership } from '@shared/db/functions/files';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  try {
    const user = await getUser();
    const { fileId } = await params;
    const isOwner = await dbVerifyFileOwnership({ fileId, userId: user.id });

    if (!isOwner) {
      return NextResponse.json({ error: 'Not authorized to access this file' }, { status: 403 });
    }

    const widthParam = request.nextUrl.searchParams.get('width');
    const heightParam = request.nextUrl.searchParams.get('height');
    const width = widthParam !== null ? Number.parseInt(widthParam, 10) : undefined;
    const height = heightParam !== null ? Number.parseInt(heightParam, 10) : undefined;
    if (
      (width !== undefined && (!Number.isFinite(width) || width <= 0)) ||
      (height !== undefined && (!Number.isFinite(height) || height <= 0)) ||
      (width === undefined && height === undefined)
    ) {
      return NextResponse.json({ error: 'Invalid width/height' }, { status: 400 });
    }

    const scaledImage = await createScaledImage({
      fileId,
      width,
      height,
    });

    return new NextResponse(new Uint8Array(scaledImage.buffer), {
      headers: {
        'Cache-Control': 'private, max-age=86400',
        'Content-Type': scaledImage.contentType,
        'Content-Length': scaledImage.buffer.byteLength.toString(),
      },
    });
  } catch (error) {
    return handleErrorInRoute(error);
  }
}
