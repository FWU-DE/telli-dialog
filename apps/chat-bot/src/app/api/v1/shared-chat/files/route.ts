import { NextRequest, NextResponse } from 'next/server';
import { handleErrorInRoute } from '@/error/handle-error-in-route';
import { uploadSharedChatFile } from '@/app/api/shared-chat/shared-chat-upload-service';
import { InvalidArgumentError } from '@shared/error';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const inviteCode = formData.get('inviteCode');
    const characterId = formData.get('characterId');
    const learningScenarioId = formData.get('learningScenarioId');
    const sharedSessionId = formData.get('sharedSessionId');

    if (file === null || typeof file === 'string') {
      throw new InvalidArgumentError('Invalid or missing file in form data');
    }

    if (typeof inviteCode !== 'string' || inviteCode.trim() === '') {
      throw new InvalidArgumentError('inviteCode is required');
    }

    if (typeof sharedSessionId !== 'string' || sharedSessionId.trim() === '') {
      throw new InvalidArgumentError('sharedSessionId is required');
    }

    const fileId = await uploadSharedChatFile({
      file,
      inviteCode,
      characterId: typeof characterId === 'string' ? characterId : undefined,
      learningScenarioId: typeof learningScenarioId === 'string' ? learningScenarioId : undefined,
      sharedSessionId,
    });

    return NextResponse.json({
      body: JSON.stringify({ file_id: fileId }),
      status: 200,
    });
  } catch (error) {
    return handleErrorInRoute(error);
  }
}
