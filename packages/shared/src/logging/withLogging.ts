import { logError } from './logging';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withLogging<T extends (...args: any[]) => any>(
  fn: T,
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    try {
      return fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        logError(error.message, error);
      } else {
        logError('An unknown error occurred', error);
      }
      throw error;
    }
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withLoggingAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      // Await the original async function
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        logError(error.message, error);
      } else {
        logError('An unknown error occurred', error);
      }
      throw error;
    }
  };
}
