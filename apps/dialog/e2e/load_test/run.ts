import { browser, Page } from 'k6/browser';
import { check } from 'k6';
import {
  BASE_URL,
  WAIT_TIMES_IN_MS,
  SELECTORS,
  DEFAULT_PROMPT,
  HEADLESS_BROWSER_OPTIONS,
  VISIBLE_BROWSER_OPTIONS,
  SCREENSHOT_FOLDERS,
  SAVE_SCREENSHOTS,
} from './config.ts';

let errorFlows = 0;
let successFlows = 0;

export const options = HEADLESS_BROWSER_OPTIONS;

export default async function main() {
  const context = await browser.newContext();
  await context.clearCookies();
  const page = await context.newPage();

  page.setDefaultTimeout(WAIT_TIMES_IN_MS.PAGE_ELEMENT_TIMEOUT);

  const userIndex = __VU + __ITER;
  const userName = 'test';
  const password = __ENV.LOADTEST_PASSWORD;

  if (!password) {
    throw new Error(
      'Please provide the password for the test user via the env variable LOADTEST_PASSWORD',
    );
  }

  try {
    await performLogin(page, userName, password);
    await selectModel(page, userIndex);
    await sendMessage(page);

    successFlows++;
    if (SAVE_SCREENSHOTS) {
      await page.screenshot({
        path: `${SCREENSHOT_FOLDERS.SUCCESS_RESULTS}/screenshot-${userIndex}.png`,
      });
    }
  } catch (error) {
    errorFlows++;
    console.error(`Error during test execution for user ${userIndex}:`, error);
    if (SAVE_SCREENSHOTS) {
      await page.screenshot({
        path: `${SCREENSHOT_FOLDERS.ERROR_RESULTS}/screenshot-${userIndex}.png`,
      });
    }
    throw error;
  } finally {
    console.info({ successFlows, errorFlows, userIndex });
    await page.close();
    await context.close();
  }
}

async function performLogin(page: Page, userName: string, password: string) {
  let successfullLogin = false;
  try {
    await page.goto(`${BASE_URL}/login?testlogin=true`);
    await page.waitForTimeout(WAIT_TIMES_IN_MS.PAGE_LOAD);

    const usernameInput = page.locator(SELECTORS.USERNAME_INPUT);
    await usernameInput.waitFor();
    await usernameInput.fill(userName);

    const passwordInput = page.locator(SELECTORS.PASSWORD_INPUT);
    await passwordInput.waitFor();
    await passwordInput.fill(password);

    const loginButton = page.locator(SELECTORS.LOGIN_BUTTON);
    await loginButton.waitFor();
    await loginButton.click();
    await page.waitForTimeout(WAIT_TIMES_IN_MS.PAGE_LOAD);
    successfullLogin = true;
  } finally {
    check(page, {
      'Login was successful': () => successfullLogin,
    });
  }
}

async function selectModel(page: Page, userIndex: number) {
  let sucessfullyselected = false;
  try {
    const dropdownLocator = page.locator(SELECTORS.LLM_DROPDOWN);
    await dropdownLocator.waitFor();

    const currentSelectedText = await dropdownLocator.textContent();
    const targetModelName =
      userIndex % 2 === 0 ? SELECTORS.LLAMA_MODEL_NAME : SELECTORS.GPT_MODEL_NAME;

    if (currentSelectedText && currentSelectedText.includes(targetModelName)) {
      sucessfullyselected = true;
      console.log(
        `Model ${targetModelName} already selected for user ${userIndex}, skipping selection`,
      );
      return;
    }

    await dropdownLocator.click();
    await page.waitForTimeout(WAIT_TIMES_IN_MS.ELEMENT_LOAD);

    const modelLocator =
      userIndex % 2 === 0 ? page.locator(SELECTORS.LLAMA_MODEL) : page.locator(SELECTORS.GPT_MODEL);

    await modelLocator.waitFor();
    await modelLocator.click();
    await page.waitForTimeout(WAIT_TIMES_IN_MS.ELEMENT_LOAD);
    console.log(`Selected model ${targetModelName} for user ${userIndex}`);
    sucessfullyselected = true;
  } finally {
    check(page, {
      'Model selected': () => sucessfullyselected,
    });
  }
}

async function sendMessage(page: Page) {
  let responseReceived = false;
  let content: string = '';
  try {
    const inputField = page.locator(SELECTORS.MESSAGE_INPUT);
    await inputField.waitFor();
    await page.waitForTimeout(200);
    await inputField.fill(DEFAULT_PROMPT);

    // This fixes the "element is not attached to the DOM" errors, by waiting for a new button
    await page.click(SELECTORS.SEND_BUTTON);

    const aiMessage = page.locator(SELECTORS.AI_MESSAGE);

    await aiMessage.waitFor({ state: 'visible', timeout: 30_000 });
    let attempts = 0;
    while (true) {
      content = (await aiMessage.textContent()) ?? '';

      if (content.includes('ENDE') || attempts > 20) {
        responseReceived = true;
        console.log(`AI response received. Content length: ${content.trim().length}`);
        return;
      }
      await page.waitForTimeout(WAIT_TIMES_IN_MS.POLL_TIME);
      attempts++;
    }
  } finally {
    check(page, {
      'AI response received via polling': () => responseReceived,
      'AI response has content': () => content.trim().length > 10,
    });
  }
}
