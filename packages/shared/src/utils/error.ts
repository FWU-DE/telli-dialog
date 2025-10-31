type ErrorWithMessage = {
  message: string;
};

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError;

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError));
  }
}

export function getErrorMessage(error: unknown) {
  return toErrorWithMessage(error).message;
}

export function getErrorWithStack(error: unknown) {
  const isError = error instanceof Error;

  if (isError) return { name: error.name, message: error.message, stack: error.stack };

  return { message: getErrorMessage(error) };
}

export type Result<T> = [Error, null] | [null, T];
export type AsyncResult<T> = Promise<Result<T>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errorifyAsyncFn<F extends (...args: any[]) => Promise<any>>(
  fn: F,
): (...args: Parameters<F>) => Promise<Result<Awaited<ReturnType<F>>>> {
  return async (...args: Parameters<F>) => {
    try {
      const value = await fn(...args);
      return [null, value];
    } catch (error) {
      console.error({ error });
      if (error instanceof Error) {
        return [error, null];
      }
      return [new Error(getErrorMessage(error)), null];
    }
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errorifyFn<F extends (...args: any[]) => any>(
  fn: F,
): (...args: Parameters<F>) => Result<ReturnType<F>> {
  return (...args: Parameters<F>) => {
    try {
      const value = fn(...args);
      return [null, value];
    } catch (error) {
      if (error instanceof Error) {
        return [error, null];
      }
      return [new Error(getErrorMessage(error)), null];
    }
  };
}
