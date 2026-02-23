import { NextRequest, NextResponse } from 'next/server';
import { generateConversationDocxFile } from './utils';
import { getUser } from '@/auth/utils';
import { type ConversationModel } from '@shared/db/types';
import { getConversationAndMessagesForExport } from '@shared/conversation/conversation-service';
import z from 'zod';
import { handleErrorInRoute } from '@/error/handle-error-in-route';

export const dynamic = 'force-dynamic';

const downloadConversationParamsSchema = z.object({
  conversationId: z.string(),
  enterpriseGptName: z.string().optional(),
});

/**
 * User wants to download a conversation as a .docx file.
 * We generate the file on the fly and return it as a response.
 * The user must be the owner of the conversation.
 *
 * enterpriseGptName contains the character name if a character was used.
 */
export async function GET(req: NextRequest) {
  try {
    // check and parse search params
    const searchParams = req.nextUrl.searchParams;
    const { conversationId, enterpriseGptName } = downloadConversationParamsSchema.parse(
      Object.fromEntries(searchParams.entries()),
    );

    // check authentication
    const user = await getUser();

    const { conversation, messages } = await getConversationAndMessagesForExport({
      conversationId,
      userId: user.id,
    });

    const document = await generateConversationDocxFile({
      conversation,
      messages,
      enterpriseGptName,
    });

    if (document === undefined) {
      return NextResponse.json({ error: 'Failed to generate the document' }, { status: 500 });
    }

    const { buffer, gptName } = document;
    const fileName = generateFileName({ conversation, gptName });

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
    handleErrorInRoute(error);
  }
}

function generateFileName({
  conversation,
  gptName,
}: {
  conversation: ConversationModel;
  gptName: string;
}): string {
  const formattedDate = conversation.createdAt.toISOString().split('T')[0];
  const fileName = `${formattedDate} ${gptName} Gespräch über ${conversation.name}.docx`;

  return fileName;
}
