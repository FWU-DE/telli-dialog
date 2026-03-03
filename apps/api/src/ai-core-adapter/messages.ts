import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions.js';
import type { Message, ChatAttachment } from '@telli/ai-core';

/**
 * Converts OpenAI-format messages to ai-core's Message format.
 * Handles both string content and structured content parts (text + image_url).
 */
export function convertToAiCoreMessages(messages: ChatCompletionMessageParam[]): Message[] {
  return messages
    .filter(
      (m) =>
        m.role === 'system' ||
        m.role === 'developer' ||
        m.role === 'user' ||
        m.role === 'assistant',
    )
    .map((m): Message => {
      // Map 'developer' role to 'system' since ai-core doesn't have a developer role
      const role: Message['role'] =
        m.role === 'developer' ? 'system' : (m.role as 'system' | 'user' | 'assistant');

      if (typeof m.content === 'string') {
        return {
          role,
          content: m.content,
        };
      }

      if (Array.isArray(m.content)) {
        const textParts: string[] = [];
        const attachments: ChatAttachment[] = [];

        for (const part of m.content) {
          if (part.type === 'text') {
            textParts.push(part.text);
          } else if (part.type === 'image_url') {
            attachments.push({
              type: 'image',
              url: part.image_url.url,
              // TODO: This might need to be determined more dynamically, perhaps by fetching the image headers
              contentType: 'image/png',
            });
          }
        }

        return {
          role,
          content: textParts.join('\n'),
          ...(attachments.length > 0 ? { attachments } : {}),
        };
      }

      return {
        role,
        content: m.content ?? '',
      };
    });
}
