import { logError } from './logging';

export function withLogging<TArgs extends readonly unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
): (...args: TArgs) => TReturn {
  return (...args: TArgs): TReturn => {
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

export function withLoggingAsync<TArgs extends readonly unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
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
