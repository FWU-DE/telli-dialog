import { describe, expect, it } from 'vitest';
import { constructRagContext } from './system-prompt';

describe('constructRagContext', () => {
  it('includes web search results in the context block', () => {
    const context = constructRagContext(
      [],
      [],
      [
        {
          type: 'text',
          name: 'Example result',
          url: 'https://example.com/article',
          content: 'Current details from the web search.',
          favicon: 'https://example.com/favicon.ico',
        },
      ],
    );

    expect(context).toContain('### Websuche');
    expect(context).toContain('https://example.com/article');
    expect(context).toContain('Current details from the web search.');
  });
});
