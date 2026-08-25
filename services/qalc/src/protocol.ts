import type { Result } from './types.js';

export function parseQalcOutput(stdout: string, maxBytes: number): Result {
  if (Buffer.byteLength(stdout) > maxBytes)
    return { status: 'malformed_output', error: 'output too large' };
  const result = stdout.trim();
  const containsControlCharacter = [...result].some((character) => {
    const code = character.codePointAt(0) ?? 0;
    return (code >= 0 && code <= 0x1f) || (code >= 0x7f && code <= 0x9f);
  });
  if (!result || containsControlCharacter) {
    return { status: 'malformed_output', error: 'qalc returned malformed output' };
  }
  return { status: 'success', result };
}
