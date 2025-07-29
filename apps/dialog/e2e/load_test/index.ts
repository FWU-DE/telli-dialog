import { browser, Page } from 'k6/browser';
import { BASE_URL } from './const';

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

function getUserNameByNumber(n: number) {
  if (n % 2 === 0) {
    return `teacher_test_${n}`;
  }
  if (n % 2 !== 0) {
    return `student_test_${n}`;
  }
  throw Error('Math not mathing');
}

// const users = readUserMappings();
// const users = JSON.parse(open('user-mappings.json'));

export default async function main() {
  const context = await browser.newContext({
    // headless: false // For debugging
  });
  await context.clearCookies();
  const page = await context.newPage();

  const userIndex = __VU + __ITER;
  const userName = getUserNameByNumber(userIndex);

  try {
    await page.goto(`${BASE_URL}/login?mocklogin=true`);
    await page.waitForTimeout(2000);

    // Take a screenshot to debug
    // await page.screenshot({ path: `debug-before-login-${userIndex}.png` });

    // Use proper locator API instead of unsupported selectors
    const loginButton = page.locator('button[aria-label="Mit VIDIS einloggen"]');
    await loginButton.waitFor();
    await loginButton.click();

    await page.fill('input[placeholder="Enter any login"]', userName);
    await page.fill('input[placeholder="and password"]', 'test');

    const signInButton = page.locator('button[type="submit"]');
    await signInButton.waitFor();
    await signInButton.click();
    await page.waitForTimeout(1000);

    const authorizeButton = page.locator('button[type="submit"]');
    await authorizeButton.waitFor();
    await authorizeButton.click();

    // simulate user chilling
    await page.waitForTimeout(2000);
    // sleep(3);
    if (userIndex % 2 === 0) {
      const dropdownLocator = page.locator('button[aria-label="Select Llm Dropdown"]');
      await dropdownLocator.waitFor();
      await dropdownLocator.click();

      await page.waitForTimeout(1000);
      const modelLocator = page.locator(
        'button[aria-label="Select meta-llama/Meta-Llama-3.1-8B-Instruct Model"]',
      );
      await modelLocator.waitFor();
      await modelLocator.click();
      await page.waitForTimeout(1000);
    }

    // send first message
    await sendMessage(DEFAULT_PROMPT, page);
    await page.waitForTimeout(5000);

    await page.screenshot({ path: `e2e/load_test/success-results/screenshot-${userIndex}.png` });
    successFlows += successFlows + 1;
  } catch (error) {
    errorFlows += errorFlows + 1;
    console.error('Error during test execution:', error);
    // Take screenshot on error
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
