import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { sendMessage } from '../../utils/chat';

/**
 * This suite is deliberately opt-in. It exercises the configured real model and
 * Sandbox Fusion gateway, rather than the deterministic mock LLM used by most
 * e2e tests. Do not replace this with request interception: a successful test
 * must prove that the authenticated chat can make the real tool call.
 */
const runtimeEnv = Reflect.get(globalThis, 'process') as {
  env?: Record<string, string | undefined>;
};
const enabled =
  runtimeEnv?.env?.E2E_CODE_EXECUTION_REAL_PROVIDER === 'true' &&
  Boolean(runtimeEnv.env.SANDBOX_FUSION_URL);

test.use({ storageState: AUTH_FILES.teacher });
test.describe.configure({ mode: 'serial' });
test.skip(
  !enabled,
  'Opt-in real-provider test. Set E2E_CODE_EXECUTION_REAL_PROVIDER=true and SANDBOX_FUSION_URL.',
);

const cases = [
  {
    language: 'Python',
    source: `
result = 37 * 23 + 5
print("TD1469_EQUATION_PYTHON=" + str(result))
try:
    import urllib.request
    urllib.request.urlopen("https://example.com", timeout=1)
    print("TD1469_NETWORK_ENABLED")
except Exception:
    print("TD1469_NETWORK_BLOCKED")
`,
    equationMarker: 'TD1469_EQUATION_PYTHON=856',
  },
  {
    language: 'JavaScript',
    source: `
const result = 37 * 23 + 5;
console.log("TD1469_EQUATION_JAVASCRIPT=" + result);
try {
  await fetch("https://example.com", { signal: AbortSignal.timeout(1000) });
  console.log("TD1469_NETWORK_ENABLED");
} catch {
  console.log("TD1469_NETWORK_BLOCKED");
}
`,
    equationMarker: 'TD1469_EQUATION_JAVASCRIPT=856',
  },
  {
    language: 'TypeScript',
    source: `
const result: number = 37 * 23 + 5;
console.log("TD1469_EQUATION_TYPESCRIPT=" + result);
try {
  await fetch("https://example.com", { signal: AbortSignal.timeout(1000) });
  console.log("TD1469_NETWORK_ENABLED");
} catch {
  console.log("TD1469_NETWORK_BLOCKED");
}
`,
    equationMarker: 'TD1469_EQUATION_TYPESCRIPT=856',
  },
] as const;

for (const { language, source, equationMarker } of cases) {
  test(
    `${language} equation execution uses the real tool and blocks network access`,
    { tag: '@external-services' },
    async ({ page }) => {
      await page.goto('/');

      await sendMessage(
        page,
        [
          `Use the execute_code tool exactly once with language ${language}.`,
          'Do not solve this mentally and do not merely describe code.',
          'Run the following source verbatim, then report its stdout and stderr verbatim:',
          source,
        ].join('\n'),
      );

      const response = page.getByLabel('assistant message 1');
      await expect(response).toBeVisible();
      await expect(response).toContainText(equationMarker);
      await expect(response).toContainText('TD1469_NETWORK_BLOCKED');
      await expect(response).not.toContainText('TD1469_NETWORK_ENABLED');
      await expect(page.getByText('Ein Fehler ist aufgetreten')).not.toBeVisible();
    },
  );
}
