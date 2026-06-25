import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@shared/logging', () => ({
  logError: vi.fn(),
}));

import { logError } from '@shared/logging';
import type { ChatMessage } from '@/types/chat';
import {
  clearSharedChatMessages,
  loadSharedChatMessages,
  saveSharedChatMessages,
  sharedChatStorageKey,
} from './shared-chat-storage';

/**
 * Minimal in-memory `Storage` for tests. The vitest config uses the `node`
 * environment, so `window` and `sessionStorage` are not provided by jsdom.
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

const INVITE_CODE = 'invite-abc-123';

function installSessionStorage(storage: Storage): void {
  (globalThis as { window?: unknown }).window = { sessionStorage: storage };
}

function uninstallSessionStorage(): void {
  delete (globalThis as { window?: unknown }).window;
}

describe('sharedChatStorageKey', () => {
  it('returns a versioned, invite-code-scoped key', () => {
    expect(sharedChatStorageKey(INVITE_CODE)).toBe(`shared-chat-messages:v1:${INVITE_CODE}`);
  });

  it('produces different keys for different invite codes', () => {
    expect(sharedChatStorageKey('a')).not.toBe(sharedChatStorageKey('b'));
  });
});

describe('shared-chat sessionStorage round-trip', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    installSessionStorage(storage);
    vi.mocked(logError).mockClear();
  });

  afterEach(() => {
    uninstallSessionStorage();
  });

  it('returns null when nothing is stored for the invite code', () => {
    expect(loadSharedChatMessages(INVITE_CODE)).toBeNull();
  });

  it('persists and restores a simple message array', () => {
    const messages: ChatMessage[] = [
      { id: 'm1', role: 'user', content: 'Hello' },
      { id: 'm2', role: 'assistant', content: 'Hi there' },
    ];

    saveSharedChatMessages(INVITE_CODE, messages);

    expect(loadSharedChatMessages(INVITE_CODE)).toEqual(messages);
  });

  it('writes to the invite-code-scoped key', () => {
    saveSharedChatMessages(INVITE_CODE, [{ id: 'm1', role: 'user', content: 'hi' }]);

    expect(storage.getItem(sharedChatStorageKey(INVITE_CODE))).not.toBeNull();
  });

  it('isolates messages between invite codes', () => {
    saveSharedChatMessages('code-a', [{ id: 'a1', role: 'user', content: 'A' }]);
    saveSharedChatMessages('code-b', [{ id: 'b1', role: 'user', content: 'B' }]);

    expect(loadSharedChatMessages('code-a')).toEqual([{ id: 'a1', role: 'user', content: 'A' }]);
    expect(loadSharedChatMessages('code-b')).toEqual([{ id: 'b1', role: 'user', content: 'B' }]);
  });

  it('strips extra ChatMessage fields that are not part of the persisted shape', () => {
    const messages: ChatMessage[] = [
      {
        id: 'm1',
        role: 'assistant',
        content: 'with extras',
        attachments: [{ type: 'image', contentType: 'image/png', url: 'data:image/png;base64,xx' }],
        webSearchResults: [{ url: 'https://example.com', title: 't', snippet: 's' } as never],
        toolCalls: [{ id: 'tc1' } as never],
        toolCallId: 'tc1',
      },
    ];

    saveSharedChatMessages(INVITE_CODE, messages);

    expect(loadSharedChatMessages(INVITE_CODE)).toEqual([
      { id: 'm1', role: 'assistant', content: 'with extras' },
    ]);
  });

  it('overwrites previously persisted messages on subsequent saves', () => {
    saveSharedChatMessages(INVITE_CODE, [{ id: 'old', role: 'user', content: 'old' }]);
    saveSharedChatMessages(INVITE_CODE, [{ id: 'new', role: 'user', content: 'new' }]);

    expect(loadSharedChatMessages(INVITE_CODE)).toEqual([
      { id: 'new', role: 'user', content: 'new' },
    ]);
  });

  it('supports persisting an empty array (e.g. after Start over)', () => {
    saveSharedChatMessages(INVITE_CODE, []);

    expect(loadSharedChatMessages(INVITE_CODE)).toEqual([]);
  });

  it('clearSharedChatMessages removes the persisted entry', () => {
    saveSharedChatMessages(INVITE_CODE, [{ id: 'm1', role: 'user', content: 'hi' }]);
    expect(loadSharedChatMessages(INVITE_CODE)).not.toBeNull();

    clearSharedChatMessages(INVITE_CODE);

    expect(loadSharedChatMessages(INVITE_CODE)).toBeNull();
    expect(storage.getItem(sharedChatStorageKey(INVITE_CODE))).toBeNull();
  });

  it('clearSharedChatMessages is a no-op when nothing is stored', () => {
    expect(() => clearSharedChatMessages(INVITE_CODE)).not.toThrow();
  });
});

describe('loadSharedChatMessages — invalid data', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    installSessionStorage(storage);
    vi.mocked(logError).mockClear();
  });

  afterEach(() => {
    uninstallSessionStorage();
  });

  it('returns null when stored value is not valid JSON', () => {
    storage.setItem(sharedChatStorageKey(INVITE_CODE), 'not json {');

    expect(loadSharedChatMessages(INVITE_CODE)).toBeNull();
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it('returns null when stored JSON does not match the ChatMessage schema', () => {
    storage.setItem(
      sharedChatStorageKey(INVITE_CODE),
      JSON.stringify([{ id: 'm1', role: 'bogus-role', content: 'x' }]),
    );

    expect(loadSharedChatMessages(INVITE_CODE)).toBeNull();
  });

  it('returns null when stored JSON is not an array', () => {
    storage.setItem(sharedChatStorageKey(INVITE_CODE), JSON.stringify({ id: 'm1' }));

    expect(loadSharedChatMessages(INVITE_CODE)).toBeNull();
  });

  it('returns null when a message is missing required fields', () => {
    storage.setItem(
      sharedChatStorageKey(INVITE_CODE),
      JSON.stringify([{ id: 'm1', role: 'user' }]), // missing content
    );

    expect(loadSharedChatMessages(INVITE_CODE)).toBeNull();
  });
});

describe('shared-chat-storage — storage unavailable', () => {
  afterEach(() => {
    uninstallSessionStorage();
    vi.mocked(logError).mockClear();
  });

  it('load returns null when window is undefined (SSR)', () => {
    uninstallSessionStorage();
    expect(loadSharedChatMessages(INVITE_CODE)).toBeNull();
  });

  it('save is a no-op when window is undefined (SSR)', () => {
    uninstallSessionStorage();
    expect(() =>
      saveSharedChatMessages(INVITE_CODE, [{ id: 'm1', role: 'user', content: 'hi' }]),
    ).not.toThrow();
  });

  it('clear is a no-op when window is undefined (SSR)', () => {
    uninstallSessionStorage();
    expect(() => clearSharedChatMessages(INVITE_CODE)).not.toThrow();
  });

  it('load returns null and logs when getItem throws', () => {
    const throwingStorage: Storage = {
      length: 0,
      clear: () => {},
      getItem: () => {
        throw new Error('storage disabled');
      },
      key: () => null,
      removeItem: () => {},
      setItem: () => {},
    };
    installSessionStorage(throwingStorage);

    expect(loadSharedChatMessages(INVITE_CODE)).toBeNull();
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it('save logs and swallows when setItem throws (e.g. quota exceeded)', () => {
    const throwingStorage: Storage = {
      length: 0,
      clear: () => {},
      getItem: () => null,
      key: () => null,
      removeItem: () => {},
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    installSessionStorage(throwingStorage);

    expect(() =>
      saveSharedChatMessages(INVITE_CODE, [{ id: 'm1', role: 'user', content: 'hi' }]),
    ).not.toThrow();
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it('clear logs and swallows when removeItem throws', () => {
    const throwingStorage: Storage = {
      length: 0,
      clear: () => {},
      getItem: () => null,
      key: () => null,
      removeItem: () => {
        throw new Error('storage disabled');
      },
      setItem: () => {},
    };
    installSessionStorage(throwingStorage);

    expect(() => clearSharedChatMessages(INVITE_CODE)).not.toThrow();
    expect(logError).toHaveBeenCalledTimes(1);
  });
});
