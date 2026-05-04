import {
  Document,
  Packer,
  Paragraph,
  Table,
  TextRun,
  AlignmentType,
  convertInchesToTwip,
} from 'docx';
import { type ConversationModel, type ConversationMessageModel } from '@shared/db/types';
import { formatDateToGermanTimestamp } from '@shared/utils/date';
import { markdownToDocx } from './markdown';
import { logError } from '@shared/logging';
import { dbGetModelByName } from '@shared/db/functions/llm-model';

const USER_FULL_NAME = 'Nutzer/in';
const DEFAULT_CONVERSATION_NAME = 'Konversation';

export async function generateConversationDocxFile({
  conversation,
  messages,
  gptName,
}: {
  conversation: ConversationModel;
  messages: ConversationMessageModel[];
  gptName: string;
}): Promise<ArrayBuffer | undefined> {
  try {
    const conversationMetadata = getConversationMetadata({
      conversation,
    });
    const messageParagraphs = getConversationMessages({
      messages,
      gptName,
      userFullName: USER_FULL_NAME,
    });

    const lastAssistantMessage = messages.findLast((m) => m.role === 'assistant');

    let modelDisplayName = lastAssistantMessage?.modelName ?? gptName;

    if (lastAssistantMessage?.modelName) {
      const modelDbEntry = await dbGetModelByName(lastAssistantMessage.modelName);
      if (modelDbEntry?.displayName) {
        modelDisplayName = modelDbEntry.displayName;
      }
    }

    messageParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generiert von telli unter Nutzung von ${modelDisplayName}`,
            italics: true,
            size: 18,
            color: '666666',
          }),
        ],
        spacing: { before: 400 },
      }),
    );

    const doc = buildDocxDocument({ conversationMetadata, messageParagraphs });
    const buffer = await Packer.toArrayBuffer(doc);

    return buffer;
  } catch (error) {
    logError('Error generating conversation .docx file', error);
    return undefined;
  }
}

export async function generateConversationMessageDocxFile({
  conversation,
  messages,
  gptName,
}: {
  conversation: ConversationModel;
  messages: ConversationMessageModel[];
  gptName: string;
}): Promise<ArrayBuffer | undefined> {
  try {
    const targetMessage = messages[messages.length - 1];

    if (targetMessage === undefined) {
      return undefined;
    }

    const conversationMetadata = getConversationMessageMetadata({
      conversation,
      message: targetMessage,
    });

    const messageParagraphs = getConversationMessages({
      messages,
      gptName,
      userFullName: USER_FULL_NAME,
    });

    let modelDisplayName = targetMessage.modelName ?? gptName;
    if (targetMessage.role === 'assistant' && targetMessage.modelName) {
      const modelDbEntry = await dbGetModelByName(targetMessage.modelName);
      if (modelDbEntry?.displayName) {
        modelDisplayName = modelDbEntry.displayName;
      }
    }

    if (targetMessage.role === 'assistant') {
      messageParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Generiert von telli unter Nutzung von ${modelDisplayName}`,
              italics: true,
              size: 18,
              color: '666666',
            }),
          ],
          spacing: { before: 400 },
        }),
      );
    }

    const doc = buildDocxDocument({ conversationMetadata, messageParagraphs });
    const buffer = await Packer.toArrayBuffer(doc);

    return buffer;
  } catch (error) {
    logError('Error generating conversation message .docx file', error);
    return undefined;
  }
}

function getConversationMetadata({ conversation }: { conversation: ConversationModel }) {
  return [
    new Paragraph({
      children: [new TextRun({ text: `Konversation: ${conversation.name}`, bold: true, size: 40 })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Erstellt am: ${formatDateToGermanTimestamp(conversation.createdAt)} Uhr`,
          size: 22,
        }),
      ],
    }),
    new Paragraph({}),
  ];
}

function getConversationMessageMetadata({
  conversation,
  message,
}: {
  conversation: ConversationModel;
  message: ConversationMessageModel;
}) {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: getConversationMessageExportTitle({
            conversationName: conversation.name,
            role: message.role,
          }),
          bold: true,
          size: 40,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Erstellt am: ${formatDateToGermanTimestamp(message.createdAt)} Uhr`,
          size: 22,
        }),
      ],
    }),
    new Paragraph({}),
  ];
}

export type SectionType = Paragraph | Table;
function getConversationMessages({
  messages,
  gptName,
  userFullName,
}: {
  messages: ConversationMessageModel[];
  gptName: string;
  userFullName: string;
}): SectionType[] {
  return messages.flatMap((message: ConversationMessageModel) => [
    new Paragraph({
      children: [
        new TextRun({
          text: `${message.role === 'user' ? userFullName : gptName}:`,
          bold: true,
          size: 22,
        }),
      ],
    }),
    ...markdownToDocx(message.content),
    new Paragraph({}),
  ]);
}

export function getConversationMessageExportTitle({
  conversationName,
  role,
}: {
  conversationName: string | null;
  role: ConversationMessageModel['role'];
}) {
  const safeConversationName = getSafeConversationName(conversationName);

  if (role === 'assistant') {
    return `Antwort aus Konversation: ${safeConversationName}`;
  }

  return `Nachricht aus Konversation: ${safeConversationName}`;
}

export function generateMessageFileName({
  conversationName,
  gptName,
  createdAt,
  role,
}: {
  conversationName: string | null;
  gptName: string;
  createdAt: Date;
  role: ConversationMessageModel['role'];
}) {
  const formattedDate = createdAt.toISOString().split('T')[0];
  const safeConversationName = getSafeConversationName(conversationName);
  const messageType = role === 'assistant' ? 'Antwort' : 'Nachricht';

  return `${formattedDate} ${gptName} ${messageType} aus ${safeConversationName}.docx`;
}

function getSafeConversationName(conversationName: string | null) {
  if (conversationName === null || conversationName.trim() === '') {
    return DEFAULT_CONVERSATION_NAME;
  }

  return conversationName;
}

export function buildDocxDocument({
  conversationMetadata,
  messageParagraphs,
}: {
  conversationMetadata: Paragraph[];
  messageParagraphs: SectionType[];
}) {
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'dgptNumbering',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.18) },
                },
              },
            },
            {
              level: 1,
              format: 'decimal',
              text: '%2.',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(1), hanging: convertInchesToTwip(0.68) },
                },
              },
            },
            {
              level: 2,
              format: 'decimal',
              text: '%3.',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(1.5), hanging: convertInchesToTwip(1.18) },
                },
              },
            },
            {
              level: 3,
              format: 'decimal',
              text: '%4.',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: 2880, hanging: 2420 },
                },
              },
            },
          ],
        },
        {
          reference: 'dgptBullet',
          levels: [
            {
              level: 0,
              format: 'bullet',
              text: '■',
              alignment: 'left',
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
                },
              },
            },
            {
              level: 1,
              format: 'bullet',
              text: '■',
              alignment: 'left',
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(1), hanging: convertInchesToTwip(0.25) },
                },
              },
            },
            {
              level: 2,
              format: 'bullet',
              text: '■',
              alignment: 'left',
              style: {
                paragraph: {
                  indent: { left: 2160, hanging: convertInchesToTwip(0.25) },
                },
              },
            },
            {
              level: 3,
              format: 'bullet',
              text: '■',
              alignment: 'left',
              style: {
                paragraph: {
                  indent: { left: 2880, hanging: convertInchesToTwip(0.25) },
                },
              },
            },
          ],
        },
      ],
    },
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: {
            font: 'Aptos',
          },
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: [...conversationMetadata, ...messageParagraphs],
      },
    ],
  });

  return doc;
}
