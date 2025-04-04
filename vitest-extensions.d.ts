import 'vitest';

declare module 'vitest' {
  interface Assertion<T = any> {
    toMatchParagraph(expected: T): void;
  }
}
