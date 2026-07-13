import { NextRequest, NextResponse } from 'next/server';
import { handleErrorInRoute } from '@/error/handle-error-in-route';
import { uploadSharedChatFile } from '@/app/api/shared-chat/shared-chat-upload-service';
import { z } from 'zod';

const requestSchema = z.object({
  file: z.custom<File>((value) => value instanceof File, {
    message: 'Invalid or missing file in form data',
  }),
  inviteCode: z
    .custom<string>((value) => typeof value === 'string' && value.trim() !== '', {
      message: 'inviteCode is required',
    })
    .transform((value) => value.trim()),
  sharedSessionId: z
    .custom<string>((value) => typeof value === 'string' && value.trim() !== '', {
      message: 'sharedSessionId is required',
    })
    .transform((value) => value.trim()),
  characterId: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() !== '' ? value : undefined),
    z.string().optional(),
  ),
  learningScenarioId: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() !== '' ? value : undefined),
    z.string().optional(),
  ),
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const parseResult = requestSchema.parse({
      file: formData.get('file'),
      inviteCode: formData.get('inviteCode'),
      characterId: formData.get('characterId'),
      learningScenarioId: formData.get('learningScenarioId'),
      sharedSessionId: formData.get('sharedSessionId'),
    });

    const fileId = await uploadSharedChatFile({
      file: parseResult.file,
      inviteCode: parseResult.inviteCode,
      characterId: parseResult.characterId,
      learningScenarioId: parseResult.learningScenarioId,
      sharedSessionId: parseResult.sharedSessionId,
    });

    return NextResponse.json({
      body: JSON.stringify({ file_id: fileId }),
      status: 200,
    });
  } catch (error) {
    return handleErrorInRoute(error);
  }
}
