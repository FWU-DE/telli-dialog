/**
 * Native streaming utilities for Server Actions.
 * Replaces ai/rsc's createStreamableValue and readStreamableValue.
 */

import { logError, logWarning } from '@shared/logging';

/**
 * Creates a streamable text value for Server Actions.
 * Returns a controller to update/complete the stream and a ReadableStream to consume.
 */
export function createTextStream(): {
  stream: ReadableStream<string>;
  update: (text: string) => void;
  done: () => void;
  error: (err: Error) => void;
} {
  let controller: ReadableStreamDefaultController<string>;

  const stream = new ReadableStream<string>({
    start(c) {
      controller = c;
    },
  });

  return {
    stream,
    update: (text: string) => {
      try {
        // Encode the text chunk for streaming
        controller.enqueue(text);
      } catch (err) {
        // Stream may be closed
        logError('createTextStream.update: failed to enqueue text; stream may be closed', err);
      }
    },
    done: () => {
      try {
        controller.close();
      } catch (err) {
        // Stream may already be closed
        logError('createTextStream.done: failed to close stream; it may already be closed', err);
      }
    },
    error: (err: Error) => {
      try {
        controller.error(err);
      } catch (caughtErr) {
        // Stream may already be closed
        logError(
          'createTextStream.error: failed to signal error on stream; it may already be closed',
          caughtErr,
        );
      }
    },
  };
}

/**
 * Async generator to read chunks from a ReadableStream.
 * Use with for-await-of loop on the client side.
 */
export async function* readTextStream(
  stream: ReadableStream<string>,
): AsyncGenerator<string, void, unknown> {
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value !== undefined) {
        yield value;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
