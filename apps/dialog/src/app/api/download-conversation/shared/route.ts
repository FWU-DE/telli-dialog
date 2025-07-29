import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateSharedConversationDocxFiles } from './utils';
import { formatDateToDayMonthYear } from '@/utils/date';

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
});

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { messages, characterName, sharedConversationName } = parsed.data;

  try {
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
        'Content-Length': buffer.length.toString(),
        'X-Filename': encodeURIComponent(fileName),
      },
    });
  } catch (error) {
    console.error('Failed to generate the document', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
