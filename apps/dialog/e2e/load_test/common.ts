import { Page } from 'k6/browser';
import { SCREENSHOT_FOLDERS } from './config';
import { check } from 'k6';
import { BASE_URL, WAIT_TIMES_IN_MS, SELECTORS } from './config';

export async function saveScreenshot(page: Page, userIndex: string, isSuccess: boolean) {
  try {
    const folder = isSuccess
      ? SCREENSHOT_FOLDERS.SUCCESS_RESULTS
      : SCREENSHOT_FOLDERS.ERROR_RESULTS;
    const prefix = isSuccess ? 'success' : 'error';
    const screenshotPath = `${folder}/${prefix}-${userIndex}.png`;

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });
  } catch (screenshotError) {
    console.error(`Failed to save screenshot for user ${userIndex}:`, screenshotError);
    // Don't throw here - we don't want screenshot failures to break the test
  }
}

export async function performLogin(page: Page, userName: string, password: string) {
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

export async function selectModel(page: Page, userIndex: number) {
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

export async function sendMessage(page: Page, prompt: string) {
  let responseReceived = false;
  let content: string = '';
  try {
    const inputField = page.locator(SELECTORS.MESSAGE_INPUT);
    await inputField.waitFor();
    await page.waitForTimeout(WAIT_TIMES_IN_MS.ELEMENT_LOAD);
    await inputField.fill(prompt);

    // This fixes the "element is not attached to the DOM" errors, by waiting for a new button
    await page.click(SELECTORS.SEND_BUTTON);

    const aiMessage = page.locator(SELECTORS.AI_MESSAGE);
    await aiMessage.waitFor({ state: 'visible', timeout: WAIT_TIMES_IN_MS.AI_MESSAGE_TIMEOUT });

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
