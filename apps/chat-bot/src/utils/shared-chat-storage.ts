import { z } from 'zod';
import { logError } from '@shared/logging';
import { chatMessageSchema, type ChatMessage } from '@/types/chat';

const STORAGE_KEY_VERSION = 'v1';

/**
 * Schema for a persisted chat message in browser storage.
 * Kept in sync with `ChatMessage` from `@/types/chat`.
 * The restored value is structurally compatible with `ChatMessage` for rendering
 * and round-trip back through the same persistence path.
 */
const persistedChatMessageSchema = chatMessageSchema
  .pick({
    id: true,
    role: true,
    content: true,
  })
  .strip();

const persistedChatMessagesSchema = z.array(persistedChatMessageSchema);

const persistedSharedFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  createdAt: z.coerce.date(),
  metadata: z.nullable(z.record(z.string(), z.unknown())),
  userId: z.string().nullable(),
});

const persistedSharedFileMappingSchema = z.record(z.string(), z.array(persistedSharedFileSchema));
const persistedSharedFileMappingPayloadSchema = z.object({
  sessionId: z.string().min(1),
  mapping: persistedSharedFileMappingSchema,
});

export type PersistedSharedFile = z.infer<typeof persistedSharedFileSchema>;

export function sharedChatStorageKey(inviteCode: string): string {
  return `shared-chat-messages:${STORAGE_KEY_VERSION}:${inviteCode}`;
}

export function sharedChatFileMappingStorageKey(inviteCode: string): string {
  return `shared-chat-files:${STORAGE_KEY_VERSION}:${inviteCode}`;
}

export function sharedChatSessionIdStorageKey(inviteCode: string): string {
  return `shared-chat-session:${STORAGE_KEY_VERSION}:${inviteCode}`;
}

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    // Access can throw in some sandboxed contexts.
    return null;
  }
}

/**
 * Load and validate persisted messages for the given invite code.
 * Returns `null` if nothing is stored, storage is unavailable, or the stored
 * value cannot be parsed to ChatMessage[].
 */
export function loadSharedChatMessages(inviteCode: string): ChatMessage[] | null {
  const storage = getSessionStorage();
  if (storage === null) return null;

  let raw: string | null;
  try {
    raw = storage.getItem(sharedChatStorageKey(inviteCode));
  } catch (error) {
    logError('Failed to read shared chat messages from sessionStorage', error);
    return null;
  }

  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    logError('Failed to parse shared chat messages from sessionStorage', error);
    return null;
  }

  const result = persistedChatMessagesSchema.safeParse(parsed);
  if (!result.success) {
    return null;
  }

  return result.data as ChatMessage[];
}

/**
 * Persist the given message array for the invite code. Best-effort: failures
 * (quota exceeded, storage disabled) are logged and swallowed so the chat
 * keeps working in-memory.
 */
export function saveSharedChatMessages(inviteCode: string, messages: ChatMessage[]): void {
  const storage = getSessionStorage();
  if (storage === null) return;

  try {
    // strips away any extra properties like attachments, webSearchResults, toolCalls, etc. that are not needed for persistence
    const parsedMessages = persistedChatMessagesSchema.parse(messages);
    storage.setItem(sharedChatStorageKey(inviteCode), JSON.stringify(parsedMessages));
  } catch (error) {
    logError('Failed to save shared chat messages to sessionStorage', error);
  }
}

/**
 * Remove any persisted messages for the invite code.
 */
export function clearSharedChatMessages(inviteCode: string): void {
  const storage = getSessionStorage();
  if (storage === null) return;

  try {
    storage.removeItem(sharedChatStorageKey(inviteCode));
  } catch (error) {
    logError('Failed to clear shared chat messages from sessionStorage', error);
  }
}

export function loadSharedChatFileMapping(
  inviteCode: string,
  sharedSessionId?: string,
): Map<string, PersistedSharedFile[]> | null {
  const storage = getSessionStorage();
  if (storage === null) return null;

  let raw: string | null;
  try {
    raw = storage.getItem(sharedChatFileMappingStorageKey(inviteCode));
  } catch (error) {
    logError('Failed to read shared chat file mapping from sessionStorage', error);
    return null;
  }

  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    logError('Failed to parse shared chat file mapping from sessionStorage', error);
    return null;
  }

  const payloadResult = persistedSharedFileMappingPayloadSchema.safeParse(parsed);

  if (payloadResult.success) {
    if (
      sharedSessionId !== undefined &&
      payloadResult.data.sessionId.trim() !== sharedSessionId.trim()
    ) {
      try {
        storage.removeItem(sharedChatFileMappingStorageKey(inviteCode));
      } catch (error) {
        logError('Failed to clear stale shared chat file mapping from sessionStorage', error);
      }
      return null;
    }

    return new Map(Object.entries(payloadResult.data.mapping));
  }

  const legacyResult = persistedSharedFileMappingSchema.safeParse(parsed);
  if (!legacyResult.success) {
    return null;
  }

  // Legacy mapping does not contain a session id and can cross session
  // boundaries. Drop it when session-aware loading is requested.
  if (sharedSessionId !== undefined) {
    try {
      storage.removeItem(sharedChatFileMappingStorageKey(inviteCode));
    } catch (error) {
      logError('Failed to clear legacy shared chat file mapping from sessionStorage', error);
    }

    return null;
  }

  return new Map(Object.entries(legacyResult.data));
}

export function saveSharedChatFileMapping(
  inviteCode: string,
  mapping: Map<string, PersistedSharedFile[]>,
  sharedSessionId?: string,
): void {
  const storage = getSessionStorage();
  if (storage === null) return;

  try {
    const serializable = Object.fromEntries(mapping);
    const parsed = persistedSharedFileMappingSchema.parse(serializable);

    if (sharedSessionId !== undefined && sharedSessionId.trim() !== '') {
      const payload = persistedSharedFileMappingPayloadSchema.parse({
        sessionId: sharedSessionId,
        mapping: parsed,
      });
      storage.setItem(sharedChatFileMappingStorageKey(inviteCode), JSON.stringify(payload));
      return;
    }

    storage.setItem(sharedChatFileMappingStorageKey(inviteCode), JSON.stringify(parsed));
  } catch (error) {
    logError('Failed to save shared chat file mapping to sessionStorage', error);
  }
}

export function clearSharedChatFileMapping(inviteCode: string): void {
  const storage = getSessionStorage();
  if (storage === null) return;

  try {
    storage.removeItem(sharedChatFileMappingStorageKey(inviteCode));
  } catch (error) {
    logError('Failed to clear shared chat file mapping from sessionStorage', error);
  }
}

export function getOrCreateSharedChatSessionId(inviteCode: string): string {
  const storage = getSessionStorage();
  if (storage === null) {
    return crypto.randomUUID();
  }

  const key = sharedChatSessionIdStorageKey(inviteCode);

  try {
    const existing = storage.getItem(key);
    if (existing !== null && existing.trim() !== '') {
      return existing;
    }

    const created = crypto.randomUUID();
    storage.setItem(key, created);
    return created;
  } catch (error) {
    logError('Failed to get or create shared chat session id', error);
    return crypto.randomUUID();
  }
}
