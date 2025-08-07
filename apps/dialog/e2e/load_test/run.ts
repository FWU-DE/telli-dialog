import { browser, Page } from 'k6/browser';
import { check } from 'k6';
import {
  BASE_URL,
  WAIT_TIMES_IN_MS,
  SELECTORS,
  DEFAULT_PROMPT,
  LOAD_TEST_OPTIONS,
  TEST_OPTIONS,
} from './config';

let errorFlows = 0;
let successFlows = 0;

export const options = __ENV.K6_BROWSER_HEADLESS === 'false' ? TEST_OPTIONS : LOAD_TEST_OPTIONS;

export default async function main() {
  const context = await browser.newContext();
  await context.clearCookies();
  const page = await context.newPage();

  page.setDefaultTimeout(WAIT_TIMES_IN_MS.PAGE_ELEMENT_TIMEOUT);

  const userIndex = __VU + __ITER;
  const userName = `teacher`;

  try {
    await performLogin(page, userName);
    await selectModel(page, userIndex);
    await sendMessageAndWait(page);

    await page.screenshot({ path: `e2e/load_test/success-results/screenshot-${userIndex}.png` });
    successFlows++;
  } catch (error) {
    errorFlows++;
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

  // Check current selected model by reading the dropdown trigger text
  const currentSelectedText = await dropdownLocator.textContent();
  const targetModelName = userIndex % 2 === 0 ? 'Llama-3.1-8B' : 'GPT-4o-mini';

  // If the target model is already selected, skip selection
  if (currentSelectedText && currentSelectedText.includes(targetModelName)) {
    console.log(
      `Model ${targetModelName} already selected for user ${userIndex}, skipping selection`,
    );
    return;
  }

  // Open dropdown and select the target model
  await dropdownLocator.click();
  await page.waitForTimeout(WAIT_TIMES_IN_MS.ELEMENT_LOAD);

  const modelLocator =
    userIndex % 2 === 0 ? page.locator(SELECTORS.LLAMA_MODEL) : page.locator(SELECTORS.GPT_MODEL);

  await modelLocator.waitFor();
  check(modelLocator, {
    'Model selector is visible': (btn) => btn !== null,
  });
  await modelLocator.click();
  await page.waitForTimeout(WAIT_TIMES_IN_MS.ELEMENT_LOAD);
  console.log(`Selected model ${targetModelName} for user ${userIndex}`);
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

  // Poll for AI response
  const maxAttempts = 30; // 30 seconds with 1-second intervals
  let attempts = 0;
  let responseReceived = false;

  while (attempts < maxAttempts && !responseReceived) {
    attempts++;

    const aiMessage = page.locator(SELECTORS.AI_MESSAGE);

    try {
      await aiMessage.waitFor({ timeout: 1000 });
      const content = await aiMessage.textContent();

      if (content && content.trim().length > 10) {
        responseReceived = true;
        console.log(
          `AI response received after ${attempts} seconds. Content length: ${content.trim().length}`,
        );

        check(aiMessage, {
          'AI response received via polling': () => true,
          'AI response has content': () => content.trim().length > 10,
        });

        return;
      }
    } catch {
      // Message not yet available, continue polling
    }

    await page.waitForTimeout(1000); // Wait 1 second before next check
  }

  if (!responseReceived) {
    check(page, {
      'AI response received within timeout': () => false,
    });
    throw new Error(`No AI response received after ${attempts} seconds`);
  }
}
