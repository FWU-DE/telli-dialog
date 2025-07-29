import { getErrorMessage } from '@/utils/error';

export class DatabaseError extends Error {
  public static from(error: unknown) {
    if (error instanceof DatabaseError) return error;

    return new DatabaseError(getErrorMessage(error));
  }
}
