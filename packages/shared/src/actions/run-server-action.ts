import { logError } from '@shared/logging';
import { ServerActionResult } from './server-action-result';
import { BusinessError } from '@shared/error/business-error';

// Helper function to serialize error objects for client transmission
function serializeError(error: BusinessError) {
  return {
    name: error.name,
    message: error.message,
    statusCode: error.statusCode,
  };
}

// helper function to run server actions with standardized error handling and logging
export function runServerAction<TReturn, TArgs extends readonly unknown[] = []>(
  callback: (...args: TArgs) => Promise<TReturn>,
): (...args: TArgs) => Promise<ServerActionResult<TReturn>> {
  return async (...args: TArgs) => {
    try {
      const value = await callback(...args);
      return { success: true, value };
    } catch (error) {
      if (error instanceof BusinessError) {
        // It is safe to log BusinessError messages because they are meant to be user-friendly
        logError(error.message, error);
        return {
          success: false,
          error: serializeError(error),
        };
      } else {
        // For other errors, log a generic message to avoid exposing sensitive information
        logError('An unexpected error occurred during server action.', error);
        // Rethrow the error to be handled by higher-level error handlers, e.g. redirect(), notFound(), etc.
        throw error;
      }
    }
  };
}
