import { NextRequest, NextResponse } from 'next/server';
import { handleErrorInRoute } from '@/error/handle-error-in-route';
import { uploadSharedChatFile } from '@/app/api/shared-chat/shared-chat-upload-service';
import { sharedChatUploadFormSchema } from '@/app/api/shared-chat/shared-chat-request-schemas';
import { requireValidInviteCode } from '@/auth/requireValidInviteCode';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const parseResult = sharedChatUploadFormSchema.parse({
      file: formData.get('file'),
      inviteCode: formData.get('inviteCode'),
      entityType: formData.get('entityType'),
      entityId: formData.get('entityId'),
      sharedSessionId: formData.get('sharedSessionId'),
    });

    await requireValidInviteCode(parseResult.inviteCode);

    const fileId = await uploadSharedChatFile({
      file: parseResult.file,
      inviteCode: parseResult.inviteCode,
      entityType: parseResult.entityType,
      entityId: parseResult.entityId,
      sharedSessionId: parseResult.sharedSessionId,
    });

    return NextResponse.json({
      body: JSON.stringify({ fileId }),
      status: 200,
    });
  } catch (error) {
    return handleErrorInRoute(error);
  }
}
