import { browser, Page } from 'k6/browser';
import { File, open } from 'k6/experimental/fs';
import encoding from 'k6/encoding';
import { WAIT_TIMES_IN_MS, HEADLESS_BROWSER_OPTIONS } from './config';
import { performLogin, saveScreenshot, selectModel, sendMessage } from './common';
import { check } from 'k6';

export const options = HEADLESS_BROWSER_OPTIONS;

const PROMPT = `Was sind große Meilensteine im Leben von Van Gogh? Bitte schreib mir dazu 2-5 Sätze. 
Bitte beende außerdem deine Nachricht mit ENDE, nur so weiß ich, dass du fertig bist.`;

const UPLOAD_FILE_PATH = 'assets/Van_Gogh_Wikipedia.pdf';

let fileData: File;
(async function () {
  fileData = await open(UPLOAD_FILE_PATH);
})();

export default async function main() {
  const context = await browser.newContext();
  await context.clearCookies();
  const page = await context.newPage();

  page.setDefaultTimeout(WAIT_TIMES_IN_MS.PAGE_ELEMENT_TIMEOUT);

  const userIndex = `${__VU}-${__ITER}-${Date.now()}`;
  const userName = 'test';
  const password = __ENV.LOADTEST_PASSWORD;

  if (!password) {
    throw new Error(
      'Please provide the password for the test user via the env variable LOADTEST_PASSWORD',
    );
  }

  let testSuccessful = false;
  let testError: Error | null = null;

  try {
    await performLogin(page, userName, password);
    await uploadPdfFile(page, userIndex);
    await selectModel(page, Number(__VU) + Number(__ITER));
    await sendMessage(page, PROMPT);

    testSuccessful = true;
    console.log(`Test successful for user ${userIndex}`);
  } catch (error) {
    testError = error as Error;
    console.error(`Error during test execution for user ${userIndex}:`, error);
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

    if (testError) {
      throw testError;
    }
  }
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

async function uploadPdfFile(page: Page, userIndex: string) {
  let successfulUpload = false;
  try {
    const buffer = await readAll(fileData);

    const file = {
      name: userIndex + '.pdf',
      mimeType: 'application/pdf',
      buffer: encoding.b64encode(buffer.buffer),
    };

    const fileInputSelector = 'input[type="file"]';

    // @ts-ignore
    await page.setInputFiles(fileInputSelector, [file]);
    await page.waitForTimeout(WAIT_TIMES_IN_MS.FILE_LOAD);
    successfulUpload = true;
  } finally {
    check(page, {
      'File uploaded successfully': () => successfulUpload,
    });
  }
}
