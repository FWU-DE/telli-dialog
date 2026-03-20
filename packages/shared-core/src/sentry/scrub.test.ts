import { describe, expect, it } from 'vitest';
import { scrubSentryEvent } from './scrub';
import { ErrorEvent } from '@sentry/core';

describe('scrubSentryEvent', () => {
  it('removes modules property', () => {
    const event = { modules: { foo: '1.0.0' } } as unknown as ErrorEvent;
    const scrubbed = scrubSentryEvent(event);
    expect(scrubbed.modules).toBeUndefined();
  });

  it('removes cookies', () => {
    const event = {
      request: {
        cookies: { session: 'abc123' },
        headers: { cookie: 'session=abc123' },
      },
    } as unknown as ErrorEvent;
    const scrubbed = scrubSentryEvent(event);
    expect(scrubbed.request?.headers?.cookie).toBe('[REDACTED]');
    expect(scrubbed.request?.cookies).toBeUndefined();
  });

  it('scrubs sensitive properties from request body', () => {
    const event = {
      request: {
        data: JSON.stringify({
          prompt: 'secret prompt',
          content: 'secret content',
          safe: 'visible',
          nested: {
            prompt: 'secret',
            safe: 'visible',
          },
          caseInsensitive: {
            PROMPT: 'secret',
          },
          array: [
            42,
            true,
            {
              nested: {
                Prompt: 'secret',
              },
            },
          ],
        }),
      },
    } as ErrorEvent;
    const scrubbed = scrubSentryEvent(event);

    expect(JSON.parse(scrubbed.request?.data as string)).toStrictEqual({
      prompt: '[REDACTED]',
      content: '[REDACTED]',
      nested: {
        prompt: '[REDACTED]',
        safe: 'visible',
      },
      caseInsensitive: {
        PROMPT: '[REDACTED]',
      },
      safe: 'visible',
      array: [
        42,
        true,
        {
          nested: {
            Prompt: '[REDACTED]',
          },
        },
      ],
    });
  });
});
