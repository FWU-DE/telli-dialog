import { Page } from 'k6/browser';
import { BASE_URL, SCREENSHOT_FOLDERS, SELECTORS, WAIT_TIMES_IN_MS } from './config';
import { check } from 'k6';

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
  let successfulLogin = false;
  try {
    await page.goto(`${BASE_URL}/login?testlogin=true`);

    const usernameInput = page.locator(SELECTORS.USERNAME_INPUT);
    await usernameInput.waitFor();
    await usernameInput.fill(userName);

    const passwordInput = page.locator(SELECTORS.PASSWORD_INPUT);
    await passwordInput.waitFor();
    await passwordInput.fill(password);

    const loginButton = page.locator(SELECTORS.LOGIN_BUTTON);
    await loginButton.waitFor();
    await loginButton.click();

    await page.locator(SELECTORS.PROFILE_BUTTON).waitFor();
    successfulLogin = true;
  } finally {
    check(page, {
      'Login was successful': () => successfulLogin,
    });
  }
}

export async function selectModel(page: Page, userIndex: number) {
  let successfullySelected = false;
  try {
    const dropdownLocator = page.locator(SELECTORS.LLM_DROPDOWN);
    await dropdownLocator.waitFor();

    const currentSelectedText = await dropdownLocator.textContent();
    const targetModelName =
      userIndex % 2 === 0 ? SELECTORS.LLAMA_MODEL_NAME : SELECTORS.GPT_MODEL_NAME;

    if (currentSelectedText && currentSelectedText.includes(targetModelName)) {
      successfullySelected = true;
      console.log(
        `Model ${targetModelName} already selected for user ${userIndex}, skipping selection`,
      );
      return;
    }

    await dropdownLocator.click();
    await page.locator(SELECTORS.DROPDOWN_WRAPPER).waitFor();

    const modelSelector = userIndex % 2 === 0 ? 'LLAMA_MODEL' : 'GPT_MODEL';
    const modelName = SELECTORS[`${modelSelector}_NAME` as const];
    const modelLocator = page.locator(SELECTORS[modelSelector]);

    await modelLocator.waitFor();

    const changeLlmResponse = page.waitForResponse(new RegExp(modelName, 'i'));
    await modelLocator.click();
    await changeLlmResponse;
    console.log(`Selected model ${targetModelName} for user ${userIndex}`);
    successfullySelected = true;
  } finally {
    check(page, {
      'Model selected': () => successfullySelected,
    });
  }
}

export async function sendMessage(page: Page, prompt: string) {
  let content = '';
  try {
    const inputField = page.locator(SELECTORS.MESSAGE_INPUT);
    await inputField.waitFor();
    await inputField.fill(prompt);

    // This fixes the "element is not attached to the DOM" errors by waiting for a new button
    await page.click(SELECTORS.SEND_BUTTON);

    const aiMessage = page.locator(SELECTORS.AI_MESSAGE);
    await aiMessage.waitFor({ timeout: WAIT_TIMES_IN_MS.AI_MESSAGE_TIMEOUT });

    await page.locator(SELECTORS.RELOAD_BUTTON).waitFor();
    content = (await aiMessage.textContent())?.trim() ?? '';
    console.log(`AI response received. Content length: ${content.length}`);
  } finally {
    check(page, {
      'AI response has expected content': () => content.includes('ENDE'),
    });
  }
}
