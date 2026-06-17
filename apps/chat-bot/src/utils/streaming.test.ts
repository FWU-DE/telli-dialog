import { describe, expect, it } from 'vitest';
import { encodeChatStreamEvent, decodeChatStreamEvent, type ChatStreamEvent } from './streaming';

const STREAM_EVENT_PREFIX = '';

describe('encodeChatStreamEvent', () => {
  it('should prefix event JSON with record separator character', () => {
    const event: ChatStreamEvent = {
      type: 'web_search_results',
      webSearchResults: [
        {
          id: 'result-1',
          url: 'https://example.com',
          title: 'Example',
          content: 'Example content',
          createdAt: new Date('2024-01-01'),
        },
      ],
    };

    const encoded = encodeChatStreamEvent(event);

    expect(encoded.startsWith(STREAM_EVENT_PREFIX)).toBe(true);
    expect(encoded.length).toBeGreaterThan(1);
  });

  it('should produce valid JSON after prefix', () => {
    const event: ChatStreamEvent = {
      type: 'web_search_results',
      webSearchResults: [],
    };

    const encoded = encodeChatStreamEvent(event);
    const jsonPart = encoded.slice(1);

    expect(() => JSON.parse(jsonPart)).not.toThrow();
    const parsed = JSON.parse(jsonPart);
    expect(parsed.type).toBe('web_search_results');
  });
});

describe('decodeChatStreamEvent', () => {
  it('should decode a valid encoded event', () => {
    const original: ChatStreamEvent = {
      type: 'web_search_results',
      webSearchResults: [
        {
          id: 'result-1',
          url: 'https://example.com',
          title: 'Example',
          content: 'Example content',
          createdAt: new Date('2024-01-01'),
        },
      ],
    };

    const encoded = encodeChatStreamEvent(original);
    const decoded = decodeChatStreamEvent(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded?.type).toBe('web_search_results');
    expect(decoded?.webSearchResults).toHaveLength(1);
    expect(decoded?.webSearchResults[0]?.url).toBe('https://example.com');
  });

  it('should return null for chunk without prefix', () => {
    const chunk = 'regular text chunk';

    const decoded = decodeChatStreamEvent(chunk);

    expect(decoded).toBeNull();
  });

  it('should return null for invalid JSON after prefix', () => {
    const chunk = STREAM_EVENT_PREFIX + '{invalid json}';

    const decoded = decodeChatStreamEvent(chunk);

    expect(decoded).toBeNull();
  });

  it('should return null for event with unrecognized type', () => {
    const chunk = STREAM_EVENT_PREFIX + '{"type":"unknown_event_type","data":{}}';

    const decoded = decodeChatStreamEvent(chunk);

    expect(decoded).toBeNull();
  });

  it('should return null for empty string', () => {
    const decoded = decodeChatStreamEvent('');

    expect(decoded).toBeNull();
  });

  it('should roundtrip with encodeChatStreamEvent', () => {
    const original: ChatStreamEvent = {
      type: 'web_search_results',
      webSearchResults: [
        {
          id: 'r1',
          url: 'https://test.com',
          title: 'Test',
          content: 'Test content',
          createdAt: new Date('2024-06-17T10:00:00Z'),
        },
        {
          id: 'r2',
          url: 'https://test2.com',
          title: 'Test 2',
          content: 'Test content 2',
          createdAt: new Date('2024-06-17T11:00:00Z'),
        },
      ],
    };

    const encoded = encodeChatStreamEvent(original);
    const decoded = decodeChatStreamEvent(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded?.type).toBe(original.type);
    expect(decoded?.webSearchResults).toHaveLength(2);
    expect(decoded?.webSearchResults[0]?.id).toBe('r1');
    expect(decoded?.webSearchResults[1]?.id).toBe('r2');
  });

  it('should handle event with empty webSearchResults array', () => {
    const original: ChatStreamEvent = {
      type: 'web_search_results',
      webSearchResults: [],
    };

    const encoded = encodeChatStreamEvent(original);
    const decoded = decodeChatStreamEvent(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded?.type).toBe('web_search_results');
    expect(decoded?.webSearchResults).toEqual([]);
  });
});
