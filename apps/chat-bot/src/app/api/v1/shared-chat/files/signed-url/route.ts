import { NextRequest, NextResponse } from 'next/server';
import { handleErrorInRoute } from '@/error/handle-error-in-route';
import { getSharedChatReadOnlySignedUrl } from '@/app/api/shared-chat/shared-chat-read-service';
import { sharedChatSignedUrlRequestSchema } from '@/app/api/shared-chat/shared-chat-request-schemas';

export async function POST(req: NextRequest) {
  try {
    const { inviteCode, characterId, learningScenarioId, fileId, sharedSessionId } =
      sharedChatSignedUrlRequestSchema.parse(await req.json());

    const signedUrl = await getSharedChatReadOnlySignedUrl({
      inviteCode,
      characterId,
      learningScenarioId,
      fileId,
      sharedSessionId,
    });

    return NextResponse.json({ signedUrl });
  } catch (error) {
    return handleErrorInRoute(error);
  }
}
