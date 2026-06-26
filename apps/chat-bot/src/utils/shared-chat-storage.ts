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

export function sharedChatStorageKey(inviteCode: string): string {
  return `shared-chat-messages:${STORAGE_KEY_VERSION}:${inviteCode}`;
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
