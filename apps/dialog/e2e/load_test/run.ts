import { browser, Page } from 'k6/browser';
import { check } from 'k6';
import { File, open } from 'k6/experimental/fs';
import encoding from 'k6/encoding';
import {
  BASE_URL,
  WAIT_TIMES_IN_MS,
  SELECTORS,
  DEFAULT_PROMPT,
  HEADLESS_BROWSER_OPTIONS,
  VISIBLE_BROWSER_OPTIONS,
  PATHS,
  SAVE_SCREENSHOTS,
  UPLOAD_FILE,
  FILE_PROMPT,
} from './config';

let errorFlows = 0;
let successFlows = 0;

let fileData: File;
(async function () {
  if (UPLOAD_FILE) {
    fileData = await open(PATHS.UPLOAD_FILE);
  }
})();

export const options =
  __ENV.K6_BROWSER_HEADLESS === 'true' ? HEADLESS_BROWSER_OPTIONS : VISIBLE_BROWSER_OPTIONS;

export default async function main() {
  const context = await browser.newContext();
  await context.clearCookies();
  const page = await context.newPage();

  page.setDefaultTimeout(WAIT_TIMES_IN_MS.PAGE_ELEMENT_TIMEOUT);

  const userIndex = __VU + __ITER;
  const userName = 'test';
  const password = 'test';

  try {
    await performLogin(page, userName, password);

    if (UPLOAD_FILE) {
      await uploadPdfFile(page);
    }

    await selectModel(page, userIndex);
    await sendMessage(page);

    successFlows++;
    if (SAVE_SCREENSHOTS) {
      await page.screenshot({
        path: `${PATHS.SUCCESS_SCREENSHOT_DIR}/screenshot-${userIndex}.png`,
      });
    }
  } catch (error) {
    errorFlows++;
    console.error(`Error during test execution for user ${userIndex}:`, error);
    if (SAVE_SCREENSHOTS) {
      await page.screenshot({
        path: `${PATHS.ERROR_SCREENSHOT_DIR}/screenshot-${userIndex}.png`,
      });
    }
  } finally {
    console.info({ successFlows, errorFlows, userIndex });
    await page.close();
    await context.close();
  }
}

async function performLogin(page: Page, userName: string, password: string) {
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
}

async function readAll(file: File) {
  const fileInfo = await file.stat();
  const buffer = new Uint8Array(fileInfo.size);

  const bytesRead = await file.read(buffer);
  if (bytesRead !== fileInfo.size) {
    throw new Error('unexpected number of bytes read');
  }

  return buffer;
}

async function uploadPdfFile(page: Page) {
  const buffer = await readAll(fileData);

  const file = {
    name: 'Geschichte_der_Kartoffel.pdf',
    mimeType: 'application/pdf',
    buffer: encoding.b64encode(buffer.buffer),
  };

  const fileInputSelector = 'input[type="file"]';

  console.log('Setting input file');
  await page.setInputFiles(fileInputSelector, [file]);
  console.log('Waiting for file upload to complete');
  await page.waitForTimeout(WAIT_TIMES_IN_MS.FILE_LOAD);
  console.log('File upload complete');
}

async function selectModel(page: Page, userIndex: number) {
  const dropdownLocator = page.locator(SELECTORS.LLM_DROPDOWN);
  await dropdownLocator.waitFor();

  const currentSelectedText = await dropdownLocator.textContent();
  const targetModelName =
    userIndex % 2 === 0 ? SELECTORS.LLAMA_MODEL_NAME : SELECTORS.GPT_MODEL_NAME;

  if (currentSelectedText && currentSelectedText.includes(targetModelName)) {
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
  check(modelLocator, {
    'Model selector is visible': (btn) => btn !== null,
  });
  await modelLocator.click();
  await page.waitForTimeout(WAIT_TIMES_IN_MS.ELEMENT_LOAD);
  console.log(`Selected model ${targetModelName} for user ${userIndex}`);
}

async function sendMessage(page: Page) {
  const inputField = page.locator(SELECTORS.MESSAGE_INPUT);
  await inputField.waitFor();
  check(inputField, {
    'Message input is visible': (input) => input !== null,
  });
  await inputField.fill(UPLOAD_FILE ? FILE_PROMPT : DEFAULT_PROMPT);

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
      await aiMessage.waitFor();
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

    await page.waitForTimeout(WAIT_TIMES_IN_MS.POLL_TIME);
  }

  if (!responseReceived) {
    check(page, {
      'AI response received within timeout': () => false,
    });
    throw new Error(`No AI response received after ${attempts} seconds`);
  }
}
