import { fail } from 'k6';
import { browser } from 'k6/browser';

// init code goes here
export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      iterations: 1,
      exec: 'main',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
};

type SetupData = {
  characterId: string;
  inviteCode: string;
};

export async function setup() {
  // we have to create a character before load test starts
  console.log('running setup()...');

  // await runTest(async ({ page, userIndex, auth }) => {
  //   await performLogin(page, auth);
  // });

  return { characterId: '', inviteCode: '' };
}

export function teardown(data: SetupData) {
  // we have to delete the character after load test ends
  console.log('running teardown()...');
}

export async function main(data: SetupData) {
  console.log('running main()...');

  const page = await browser.newPage();

  try {
    await page.goto('https://test.k6.io');
  } catch (error) {
    if (error instanceof Error) {
      fail(`Browser iteration failed: ${error.message}`);
    } else {
      fail('Browser iteration failed with unknown error');
    }
  } finally {
    await page.close();
  }

  // await runTest(async ({ page, userIndex, auth }) => {
  //   await performLogin(page, auth);
  // });
}
