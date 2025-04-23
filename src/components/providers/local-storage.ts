import { z } from 'zod';
import { messageRoleSchema } from '../chat/schemas';

const isClient = typeof window !== 'undefined';

export function saveToLocalStorage(key: string, value: string) {
  if (isClient) {
    localStorage.setItem(key, value);
  }
}

export function readFromLocalStorage(key: string): string | null {
  if (isClient) {
    return localStorage.getItem(key);
  }
  return null;
}

export function constructLocalStorageKey({ id, inviteCode }: { id: string; inviteCode: string }) {
  return `character-chat-${id}-${inviteCode}`;
}

export function getMaybeLocaleStorageChats({ id, inviteCode }: { id: string; inviteCode: string }) {
  const value = readFromLocalStorage(constructLocalStorageKey({ id, inviteCode }));
  if (value === null) return undefined;
  try {
    const json = JSON.parse(value);
    const parsedValue = z
      .array(z.object({ role: messageRoleSchema, content: z.string() }))
      .parse(json);
    return parsedValue;
  } catch (error: unknown) {
    console.error({ error });
    return undefined;
  }
}
