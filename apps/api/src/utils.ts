type AsyncFunction<T> = () => Promise<T>;

export async function withErrorHandling<T>(
  asyncFunc: AsyncFunction<T>,
): Promise<[Error, null] | [null, T]> {
  try {
    const data = await asyncFunc();
    return [null, data];
  } catch (error) {
    return [error instanceof Error ? error : new Error(String(error)), null];
  }
}
