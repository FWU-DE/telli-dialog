import { NextRequest, NextResponse } from 'next/server';
import { InvalidArgumentError } from '@shared/error';
import { handleErrorInRoute } from '@/error/handle-error-in-route';
import { getSharedChatReadOnlySignedUrl } from '@/app/api/shared-chat/shared-chat-read-service';

export async function POST(req: NextRequest) {
  try {
    const {
      inviteCode,
      characterId,
      learningScenarioId,
      fileId,
      sharedSessionId,
    }: {
      inviteCode?: string;
      characterId?: string;
      learningScenarioId?: string;
      fileId?: string;
      sharedSessionId?: string;
    } = await req.json();

    if (inviteCode === undefined || inviteCode.trim() === '') {
      throw new InvalidArgumentError('inviteCode is required');
    }

    if (fileId === undefined || fileId.trim() === '') {
      throw new InvalidArgumentError('fileId is required');
    }

    if (sharedSessionId === undefined || sharedSessionId.trim() === '') {
      throw new InvalidArgumentError('sharedSessionId is required');
    }

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
