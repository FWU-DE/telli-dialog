import { browser, BrowserContext, Page } from 'k6/browser';
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

function tagHttpRequests(page: Page) {
  page.on('metric', (metric) => {
    metric.tag({
      name: `${BASE_URL}/d/[conversationId]`,
      matches: [{ url: new RegExp(`^${BASE_URL}/d/[a-zA-Z0-9-]+($|\\?)`) }],
    });
    metric.tag({
      name: `${BASE_URL}/characters/d/[characterId]/[conversationId]`,
      matches: [
        { url: new RegExp(`^${BASE_URL}/characters/d/[a-zA-Z0-9-]+/[a-zA-Z0-9-]+($|\\?)`) },
      ],
    });
    metric.tag({
      name: `${BASE_URL}/custom/d/[gptId]`,
      matches: [{ url: new RegExp(`^${BASE_URL}/custom/d/[a-zA-Z0-9-]+($|\\?)`) }],
    });
    metric.tag({
      name: `${BASE_URL}/custom/d/[gptId]/[conversationId]`,
      matches: [{ url: new RegExp(`^${BASE_URL}/custom/d/[a-zA-Z0-9-]+/[a-zA-Z0-9-]+($|\\?)`) }],
    });
    metric.tag({
      name: `${BASE_URL}/_next/static/*`,
      matches: [{ url: new RegExp(`^${BASE_URL}/_next/static/.+`) }],
    });
  });
}

export async function runTest(
  testFunction: (data: {
    context: BrowserContext;
    page: Page;
    userIndex: string;
    userName: string;
    password: string;
  }) => Promise<void>,
) {
  const context = await browser.newContext();
  await context.clearCookies();
  const page = await context.newPage();
  tagHttpRequests(page);

  page.setDefaultTimeout(WAIT_TIMES_IN_MS.PAGE_ELEMENT_TIMEOUT);

  const userIndex = `${__VU}-${__ITER}-${Date.now()}`;
  const userName = __ENV.LOADTEST_USERNAME;
  const password = __ENV.LOADTEST_PASSWORD;

  if (!userName || !password) {
    throw new Error(
      'Please provide the username/password for the test user via the env variables LOADTEST_USERNAME and LOADTEST_PASSWORD',
    );
  }

  let testSuccessful = false;

  try {
    await testFunction({ context, page, userIndex, userName, password });

    testSuccessful = true;
    console.log(`Test successful for user ${userIndex}`);
  } catch (error) {
    console.error(`Error during test execution for user ${userIndex}:`, error);
    throw error;
  } finally {
    await saveScreenshot(page, userIndex, testSuccessful);

    console.info({
      userIndex,
      testSuccessful,
      vu: __VU,
      iter: __ITER,
    });

    await page.close();
    await context.close();
  }
}

export async function performLogin(page: Page, userName: string, password: string) {
  let successfulLogin = false;
  try {
    await page.goto(`${BASE_URL}/login`, {
      timeout: WAIT_TIMES_IN_MS.NAVIGATION_TIMEOUT,
    });

    await page.getByRole('button', { name: 'Mit VIDIS einloggen' }).click();

    const usernameInput = page.getByLabel('Username');
    await usernameInput.waitFor();
    await usernameInput.fill(userName);

    const passwordInput = page.getByRole('textbox', { name: 'Password' });
    await passwordInput.waitFor();
    await passwordInput.fill(password);

    const loginButton = page.locator('button[type=submit]');
    await loginButton.waitFor();
    await loginButton.click();

    await page.waitForNavigation({ url: /\/?$/, timeout: WAIT_TIMES_IN_MS.NAVIGATION_TIMEOUT });
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

    const changeLlmNavigation = page.waitForURL(new RegExp(modelName, 'i'), {
      timeout: WAIT_TIMES_IN_MS.NAVIGATION_TIMEOUT,
    });
    await modelLocator.click();
    await changeLlmNavigation;
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

    const sendButton = page.locator(SELECTORS.SEND_BUTTON);
    await sendButton.waitFor();
    await sendButton.click();

    const aiMessage = page.locator(SELECTORS.AI_MESSAGE);
    await aiMessage.waitFor({ timeout: WAIT_TIMES_IN_MS.AI_MESSAGE_TIMEOUT });

    await page
      .locator(SELECTORS.RELOAD_BUTTON)
      .waitFor({ timeout: WAIT_TIMES_IN_MS.AI_MESSAGE_TIMEOUT });
    content = (await aiMessage.textContent())?.trim() ?? '';
    console.log(`AI response received. Content length: ${content.length}`);
  } finally {
    check(page, {
      'AI response has expected content': () => content.length > 10,
    });
  }
}
