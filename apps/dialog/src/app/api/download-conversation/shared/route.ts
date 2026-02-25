import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateSharedConversationDocxFiles } from './utils';
import { formatDateToDayMonthYear } from '@shared/utils/date';
import { handleErrorInRoute } from '@/error/handle-error-in-route';
import { checkInviteCodeForExport } from '@shared/conversation/conversation-service';

const requestSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
      role: z.enum(['user', 'assistant', 'system']),
    }),
  ),
  characterName: z.string().optional(),
  sharedConversationName: z.string().optional(),
  inviteCode: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parseResult = requestSchema.parse(json);
    await checkInviteCodeForExport({ inviteCode: parseResult.inviteCode });

    const { messages, characterName, sharedConversationName } = parseResult;

    const conversationObject = await generateSharedConversationDocxFiles({
      conversationMessages: messages,
      userFullName: 'Nutzer/in',
    });

    if (conversationObject === undefined) {
      return NextResponse.json({ error: 'Failed to generate the document' }, { status: 500 });
    }

    const { buffer } = conversationObject;
    const fileName = generateFileName({ characterName, sharedConversationName });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Length': buffer.byteLength.toString(),
        'X-Filename': encodeURIComponent(fileName),
      },
    });
  } catch (error) {
    return handleErrorInRoute(error);
  }
}

function generateFileName({
  characterName,
  sharedConversationName,
}: {
  characterName?: string;
  sharedConversationName?: string;
}) {
  const currentDate = formatDateToDayMonthYear(new Date());

  if (characterName !== undefined) {
    return `${currentDate}-Gespräch mit ${characterName}.docx`;
  }

  if (sharedConversationName !== undefined) {
    return `${currentDate}-Dialog über ${sharedConversationName}.docx`;
  }

  return 'Telli-Konversation.docx';
}
