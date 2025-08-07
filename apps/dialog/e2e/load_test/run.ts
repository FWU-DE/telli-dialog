import { browser, Page } from 'k6/browser';
import { check } from 'k6';
import { BASE_URL } from './const';

const WAIT_TIMES_IN_MS = {
  PAGE_LOAD: 5000,
  PAGE_ELEMENT_TIMEOUT: 10000, // Maximum time to wait for an element to appear
  ELEMENT_LOAD: 1000,
  MESSAGE_RESPONSE: 5000,
};

const SELECTORS = {
  LOGIN_BUTTON: 'button[aria-label="Mit VIDIS einloggen"]',
  USERNAME_INPUT: 'input[placeholder="Enter any login"]',
  PASSWORD_INPUT: 'input[placeholder="and password"]',
  SIGN_IN_BUTTON: 'button[type="submit"]',
  LLM_DROPDOWN: 'button[aria-label="Select Llm Dropdown"]',
  LLAMA_MODEL: 'button[aria-label="Select meta-llama/Meta-Llama-3.1-8B-Instruct Model"]',
  GPT4_MODEL: 'button[aria-label="Select gpt-4o-mini Model"]',
  MESSAGE_INPUT: 'textarea[placeholder="Wie kann ich Dir helfen?"]',
  SEND_BUTTON: 'button[aria-label="Nachricht abschicken"]',
} as const;

const DEFAULT_PROMPT = `Ich bin Lehrer für Chemie in der 7. Klasse an einem Gymnasium in Bayern. Ich möchte eine Unterrichtsstunde zum Thema Wasserstoffreaktionen vorbereiten, die 90 Minuten dauert. Mein Ziel ist es, dass die Schüler am Ende der Stunde verstehen, warum Wasserstoff stark reaktiv ist und warum das Gemisch aus Wasserstoff und Sauerstoff bei Entzündung eine deutlich stärkere Reaktion auslöst. Die Klasse besteht aus 20 Schülern mit besonderem Interesse an interessanten Experimenten.
Bitte erstelle für mich eine detaillierte Unterrichtsplanung. Gehe auf Konzepte ein, mit denen ich den Unterricht ansprechender machen kann, z.B. Gruppenarbeiten, Präsentationen usw…
Gib mir zusätzlich kreative Ideen für den Unterrichtseinstieg oder anschauliche Beispiele, die das Thema greifbarer machen. Achte darauf, dass die Planung leicht umsetzbar ist.
`;

export const LOAD_TEST_OPTIONS = {
  scenarios: {
    ui_with_browser: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 10 }, // Ramp up gradually
        { duration: '2m', target: 50 }, // Moderate load
        { duration: '2m', target: 100 }, // Peak load
        { duration: '5m', target: 100 }, // Sustain peak
        { duration: '1m', target: 0 }, // Ramp down
      ],
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    checks: ['rate>0.95'], // 95% of checks must pass
    http_req_duration: ['p(95)<10000'], // 95% of requests must complete within 10s
    browser_web_vital_fcp: ['p(95)<3000'], // First Contentful Paint
    browser_web_vital_lcp: ['p(95)<5000'], // Largest Contentful Paint
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
  const context = await browser.newContext();
  await context.clearCookies();
  const page = await context.newPage();

  // Set page timeout
  page.setDefaultTimeout(WAIT_TIMES_IN_MS.PAGE_ELEMENT_TIMEOUT);

  const userIndex = __VU + __ITER;
  const userName = `teacher`;

  try {
    await performLogin(page, userName);
    await selectModel(page, userIndex);
    await sendMessageAndWait(page);

    await page.screenshot({ path: `e2e/load_test/success-results/screenshot-${userIndex}.png` });
    successFlows += 1;
  } catch (error) {
    errorFlows += 1;
    console.error(`Error during test execution for user ${userIndex}:`, error);
    await page.screenshot({ path: `e2e/load_test/error-results/screenshot-${userIndex}.png` });
  } finally {
    console.info({ successFlows, errorFlows, userIndex });
    await page.close();
    await context.close();
  }
}

async function performLogin(page: Page, userName: string) {
  await page.goto(`${BASE_URL}/login?mocklogin=true`);
  await page.waitForTimeout(WAIT_TIMES_IN_MS.PAGE_LOAD);

  const loginButton = page.locator(SELECTORS.LOGIN_BUTTON);
  await loginButton.waitFor();
  check(loginButton, {
    'Login button is visible': (btn) => btn !== null,
  });
  await loginButton.click();

  const usernameInput = page.locator(SELECTORS.USERNAME_INPUT);
  await usernameInput.waitFor();
  await usernameInput.fill(userName);

  const passwordInput = page.locator(SELECTORS.PASSWORD_INPUT);
  await passwordInput.waitFor();
  await passwordInput.fill('test');

  const signInButton = page.locator(SELECTORS.SIGN_IN_BUTTON);
  await signInButton.waitFor();
  await signInButton.click();
  await page.waitForTimeout(WAIT_TIMES_IN_MS.ELEMENT_LOAD);

  // Handle authorization page
  const authorizeButton = page.locator(SELECTORS.SIGN_IN_BUTTON);
  await authorizeButton.waitFor();
  await authorizeButton.click();

  // Wait for redirect
  await page.waitForTimeout(WAIT_TIMES_IN_MS.PAGE_LOAD);
}

async function selectModel(page: Page, userIndex: number) {
  const dropdownLocator = page.locator(SELECTORS.LLM_DROPDOWN);
  await dropdownLocator.waitFor();
  await dropdownLocator.click();
  await page.waitForTimeout(WAIT_TIMES_IN_MS.ELEMENT_LOAD);

  const modelLocator =
    userIndex % 2 === 0 ? page.locator(SELECTORS.LLAMA_MODEL) : page.locator(SELECTORS.GPT4_MODEL);

  await modelLocator.waitFor();
  check(modelLocator, {
    'Model selector is visible': (btn) => btn !== null,
  });
  await modelLocator.click();
  await page.waitForTimeout(WAIT_TIMES_IN_MS.ELEMENT_LOAD);
}

async function sendMessageAndWait(page: Page) {
  const inputField = page.locator(SELECTORS.MESSAGE_INPUT);
  await inputField.waitFor();
  check(inputField, {
    'Message input is visible': (input) => input !== null,
  });
  await inputField.fill(DEFAULT_PROMPT);

  const sendButton = page.locator(SELECTORS.SEND_BUTTON);
  await sendButton.waitFor();
  await sendButton.click();

  // Wait for AI response (longer timeout)
  await page.waitForTimeout(WAIT_TIMES_IN_MS.MESSAGE_RESPONSE);
}
