import { beforeEach, describe, expect, it, vi } from 'vitest';
import { enrichMessagesWithImageData, determineImageAttachmentTypeForModel } from './utils';
import { type ChatMessage } from '@/types/chat';
import { type ChatAttachmentWithMessageId } from '../file-operations/preprocess-image';
import type { LlmModelSelectModel } from '@shared/db/schema';

const anthropicModel: LlmModelSelectModel = {
  id: 'model-1',
  name: 'anthropic/claude-3-5-sonnet-v2@20241022',
  displayName: 'Claude 3.5 Sonnet v2',
  description: '',
  provider: 'google',
  createdAt: new Date(),
  isDeleted: false,
  isNew: true,
  priceMetadata: {
    type: 'text',
    completionTokenPrice: 0.001,
    promptTokenPrice: 0.001,
  },
  supportedImageFormats: ['image/png'],
};

const openAiModel: LlmModelSelectModel = {
  id: 'model-2',
  name: 'gpt-4o',
  displayName: 'GPT-4o',
  description: '',
  provider: 'openai',
  createdAt: new Date(),
  isDeleted: false,
  isNew: true,
  priceMetadata: {
    type: 'text',
    completionTokenPrice: 0.001,
    promptTokenPrice: 0.001,
  },
  supportedImageFormats: ['image/png'],
};

vi.mock('@shared/logging', () => ({
  logError: vi.fn(),
}));

describe('enrichMessagesWithImageData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return messages unchanged if modelSupportsImages is false', () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Hello', id: '1' }];
    const images: ChatAttachmentWithMessageId[] = [
      {
        type: 'image',
        url: 'https://example.com/image.png',
        contentType: 'image/png',
        messageId: '1',
      },
    ];

    const result = enrichMessagesWithImageData(messages, images, false, 'url');

    expect(result).toEqual(messages);
    expect(result[0]?.attachments).toBeUndefined();
  });

  it('should return messages unchanged if images array is empty', () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Hello', id: '1' }];

    const result = enrichMessagesWithImageData(messages, [], true, 'url');

    expect(result).toEqual(messages);
  });

  it('should attach images to the correct user message by messageId', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'First', id: 'msg-1' },
      { role: 'assistant', content: 'Response', id: 'msg-2' },
      { role: 'user', content: 'Second', id: 'msg-3' },
    ];

    const images: ChatAttachmentWithMessageId[] = [
      {
        type: 'image',
        url: 'https://example.com/image1.png',
        contentType: 'image/png',
        messageId: 'msg-1',
      },
      {
        type: 'image',
        url: 'https://example.com/image2.png',
        contentType: 'image/png',
        messageId: 'msg-3',
      },
    ];

    const result = enrichMessagesWithImageData(messages, images, true, 'url');

    expect(result[0]?.attachments).toHaveLength(1);
    expect(result[0]?.attachments?.[0]?.url).toBe('https://example.com/image1.png');
    expect(result[1]?.attachments).toBeUndefined();
    expect(result[2]?.attachments).toHaveLength(1);
    expect(result[2]?.attachments?.[0]?.url).toBe('https://example.com/image2.png');
  });

  it('should handle multiple images for the same message', () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Describe these', id: 'msg-1' }];

    const images: ChatAttachmentWithMessageId[] = [
      {
        type: 'image',
        url: 'https://example.com/image1.png',
        contentType: 'image/png',
        messageId: 'msg-1',
      },
      {
        type: 'image',
        url: 'https://example.com/image2.jpg',
        contentType: 'image/jpeg',
        messageId: 'msg-1',
      },
      {
        type: 'image',
        url: 'data:image/png;base64,iVBORw0KGgo=',
        contentType: 'image/png',
        messageId: 'msg-1',
      },
    ];

    const result = enrichMessagesWithImageData(messages, images, true, 'url');

    expect(result[0]?.attachments).toHaveLength(3);
    expect(result[0]?.attachments?.[0]?.url).toBe('https://example.com/image1.png');
    expect(result[0]?.attachments?.[1]?.url).toBe('https://example.com/image2.jpg');
    expect(result[0]?.attachments?.[2]?.url).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('should create a shallow copy of messages array', () => {
    const messages: ChatMessage[] = [{ role: 'user', content: 'Hello', id: 'msg-1' }];
    const images: ChatAttachmentWithMessageId[] = [
      {
        type: 'image',
        url: 'https://example.com/image.png',
        contentType: 'image/png',
        messageId: 'msg-1',
      },
    ];

    const result = enrichMessagesWithImageData(messages, images, true, 'url');

    expect(result).not.toBe(messages);
    expect(result[0]?.attachments).toBeDefined();
  });
});

describe('determineImageAttachmentTypeForModel', () => {
  it('should return "base64" for google provider with anthropic/ model name', () => {
    const model = anthropicModel;

    expect(determineImageAttachmentTypeForModel(model)).toBe('base64');
  });

  it('should return "url" for openai provider', () => {
    const model = openAiModel;

    expect(determineImageAttachmentTypeForModel(model)).toBe('url');
  });
});
