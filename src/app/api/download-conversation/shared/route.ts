import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateSharedConversationDocxFiles } from './utils';

const requestSchema = z.array(
  z.object({
    id: z.string(),
    content: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
  }),
);

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const messages = parsed.data;

  try {
    const conversationObject = await generateSharedConversationDocxFiles({
      conversationMessages: messages,
      userFullName: 'Nutzer/in',
    });

    if (conversationObject === undefined) {
      return NextResponse.json({ error: 'Failed to generate the document' }, { status: 500 });
    }

    const { buffer } = conversationObject;
    const fileName = 'Telli Konversation.docx';

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
