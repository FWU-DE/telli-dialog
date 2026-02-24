import { getErrorMessage } from "./error-utils";

export type Result<T> = [Error, null] | [null, T];
export type AsyncResult<T> = Promise<Result<T>>;

export function errorifyAsyncFn<
  F extends (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>>,
>(fn: F): (...args: Parameters<F>) => Promise<Result<Awaited<ReturnType<F>>>> {
  return async (...args: Parameters<F>) => {
    try {
      const value = await fn(...args);
      return [null, value];
    } catch (error) {
      if (error instanceof Error) {
        return [error, null];
      }
      return [new Error(getErrorMessage(error)), null];
    }
  };
}

export function errorifyFn<F extends (...args: Parameters<F>) => ReturnType<F>>(
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
