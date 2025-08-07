import { browser, Page } from 'k6/browser';
import { BASE_URL } from './config';

const DEFAULT_PROMPT = `Ich bin Lehrer für Chemie in der 7. Klasse an einem Gymnasium in Bayern. Ich möchte eine Unterrichtsstunde zum Thema Wasserstoffreaktionen vorbereiten, die 90 Minuten dauert. Mein Ziel ist es, dass die Schüler am Ende der Stunde verstehen, warum Wasserstoff stark reaktiv ist und warum das Gemisch aus Wasserstoff und Sauerstoff bei Entzündung eine deutlich stärkere Reaktion auslöst. Die Klasse besteht aus 20 Schülern mit besonderem Interesse an interessanten Experimenten.
Bitte erstelle für mich eine detaillierte Unterrichtsplanung. Gehe auf Konzepte ein, mit denen ich den Unterricht ansprechender machen kann, z.B. Gruppenarbeiten, Präsentationen usw…
Gib mir zusätzlich kreative Ideen für den Unterrichtseinstieg oder anschauliche Beispiele, die das Thema greifbarer machen. Achte darauf, dass die Planung leicht umsetzbar ist.
`;

export const LOAD_TEST_OPTIONS = {
  scenarios: {
    ui_with_browser: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 500 },
        { duration: '1m', target: 1000 },
        { duration: '2m', target: 1000 },
        { duration: '30s', target: 0 },
      ],
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    checks: ['rate>0.9'], // 90% of checks must pass
    http_req_duration: ['p(95)<5000'], // 95% of requests must complete within 5s
  },
};

const TEST_OPTIONS = {
  scenarios: {
    ui_test: {
      executor: 'constant-vus',
      vus: 1, // Only run 1 user to see the UI
      duration: '2m', // Run long enough for debugging
      options: {
        browser: {
          type: 'chromium', // Required to enable browser execution
        },
      },
    },
  },
};

let errorFlows = 0;
let successFlows = 0;

export const options = __ENV.K6_BROWSER_HEADLESS === 'false' ? TEST_OPTIONS : LOAD_TEST_OPTIONS;

export default async function main() {
  const context = await browser.newContext({
    // headless: false // For debugging
  });
  await context.clearCookies();
  const page = await context.newPage();

  const userIndex = __VU + __ITER;
  const userName = 'teacher';

  try {
    await page.goto(`${BASE_URL}/login?mocklogin=true`);
    await page.waitForTimeout(2000);

    const loginButton = page.locator('button[aria-label="Mit VIDIS einloggen"]');
    await loginButton.waitFor();
    await loginButton.click();

    const usernameInput = page.locator('input[placeholder="Enter any login"]');
    await usernameInput.waitFor();
    await usernameInput.fill(userName);

    const passwordInput = page.locator('input[placeholder="and password"]');
    await passwordInput.waitFor();
    await passwordInput.fill('test');

    const signInButton = page.locator('button[type="submit"]');
    await signInButton.waitFor();
    await signInButton.click();
    await page.waitForTimeout(1000);

    const authorizeButton = page.locator('button[type="submit"]');
    await authorizeButton.waitFor();
    await authorizeButton.click();

    // simulate user chilling
    await page.waitForTimeout(2000);

    const dropdownLocator = page.locator('button[aria-label="Select Llm Dropdown"]');
    await dropdownLocator.waitFor();
    await dropdownLocator.click();

    await page.waitForTimeout(1000);

    let modelLocator;
    if (userIndex % 2 === 0) {
      modelLocator = page.locator(
        'button[aria-label="Select meta-llama/Meta-Llama-3.1-8B-Instruct Model"]',
      );
    } else {
      modelLocator = page.locator('button[aria-label="Select gpt-4o Model"]');
    }
    await modelLocator.waitFor();
    await modelLocator.click();
    await page.waitForTimeout(1000);

    await sendMessage(DEFAULT_PROMPT, page);
    await page.waitForTimeout(5000);

    await page.screenshot({ path: `e2e/load_test/success-results/screenshot-${userIndex}.png` });
    successFlows += successFlows + 1;
  } catch (error) {
    errorFlows += errorFlows + 1;
    console.error('Error during test execution:', error);
    await page.screenshot({ path: `e2e/load_test/error-results/screenshot-${userIndex}.png` });
  } finally {
    console.info({ successFlows, errorFlows });
    await page.close();
    await context.close();
  }
}

async function sendMessage(text: string, page: Page) {
  const inputField = page.locator('textarea[placeholder="Wie kann ich Dir helfen?"]');
  await inputField.waitFor();
  await inputField.fill(text);

  const sendMessageButton = page.locator('button[aria-label="Nachricht abschicken"]');
  await sendMessageButton.waitFor();
  await sendMessageButton.click();
}
