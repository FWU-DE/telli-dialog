import { browser } from 'k6/browser';
import { WAIT_TIMES_IN_MS, HEADLESS_BROWSER_OPTIONS } from './config';
import { performLogin, saveScreenshot, selectModel, sendMessage } from './common';

export const options = HEADLESS_BROWSER_OPTIONS;

const PROMPT = `Ich bin eine Lehrerin an einer Schule und unterrichte ein technisches Fach. 
Wie kann ich dennoch dazu beitragen, den Schülerinnen und Schülern soziale Werte zu vermitteln? Bitte schreib mir dazu 2-5 Sätze. 
Bitte beende außerdem deine Nachricht mit ENDE, nur so weiß ich, dass du fertig bist.`;

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
