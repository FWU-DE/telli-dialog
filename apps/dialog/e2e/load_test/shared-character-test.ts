import { runTest } from './common';
import { SharedCharacterPage } from './page-objects/SharedCharacterPage';

// init code goes here
export const options = {
  scenarios: {
    teacher_shares_character: {
      executor: 'per-vu-iterations',
      startTime: '5s',
      gracefulStop: '5s',
      iterations: 1,
      vus: 10,
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
};

type TestSetupParams = {
  characterId: string;
  inviteCode: string;
};

export function setup(): TestSetupParams {
  console.log('running setup()...');
  // Todo: call endpoint to create character and share it
  // const response = http.post('url');
  // if (response.status !== 200) {
  //   exec.test.abort('Could not create shared character for load test');
  // }

  const characterId = '9e6bcbf7-e35e-4d56-a3bd-278304bff06f';
  const inviteCode = '2P4NKCG4';

  return { characterId, inviteCode };
}

export function teardown(sharedCharacterData: TestSetupParams) {
  console.log('running teardown()...');

  if (sharedCharacterData?.characterId) {
    console.log(`Cleaning up character with ID: ${sharedCharacterData.characterId}`);
    // Todo: call endpoint to delete character by id
    console.log('Character cleanup completed');
  }
}

export default async function main(sharedCharacterData: TestSetupParams) {
  await runTest(async ({ page }) => {
    const sharedCharacterPage = new SharedCharacterPage(
      page,
      sharedCharacterData.characterId,
      sharedCharacterData.inviteCode,
    );
    await sharedCharacterPage.goto();
    await sharedCharacterPage.sendMessage('Hallo, wer bist du?');
    await sharedCharacterPage.sendMessage('Was waren deine größten Erfindungen?');
    await sharedCharacterPage.sendMessage('Wie lange hast du gelebt?');
    await sharedCharacterPage.sendMessage('Wo bist du aufgewachsen?');

    console.log('test completed successfully');
  });
}
