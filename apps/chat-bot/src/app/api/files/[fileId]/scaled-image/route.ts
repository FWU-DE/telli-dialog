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

    const scaledImage = await createScaledImage({
      fileId,
      width: Number(request.nextUrl.searchParams.get('width')) ?? undefined,
      height: Number(request.nextUrl.searchParams.get('height')) ?? undefined,
    });

    return new NextResponse(new Uint8Array(scaledImage.buffer), {
      headers: {
        'Cache-Control': 'private, max-age=86400',
        'Content-Type': scaledImage.contentType,
      },
    });
  } catch (error) {
    return handleErrorInRoute(error);
  }
}
