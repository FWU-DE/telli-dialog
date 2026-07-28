import { validate as validateUUID, v4 as generateUUIDv4 } from 'uuid';

export function generateUUID(): string {
  return generateUUIDv4();
}

export function isUUID(uuid: string): boolean {
  return validateUUID(uuid);
}
