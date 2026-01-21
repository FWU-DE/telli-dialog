import exec from 'k6/execution';
import { runTest } from './common';
import { SharedCharacterPage } from './page-objects/SharedCharacterPage';
import { SharedCharacterProxy } from './utils/shared-character-proxy';

// There must be an existing character that can be shared.
// When the load test is executed, you have to pass credentials
// of the owner of this character in order to share it.
const existingCharacterTemplateId = 'd573e344-8119-46ca-bf9e-371800cf2782';

export const options = {
  cloud: {
    distribution: {
      distributionLabel1: { loadZone: 'amazon:de:frankfurt', percent: 100 },
    },
  },
  scenarios: {
    teacher_shares_character: {
      executor: 'per-vu-iterations',
      startTime: '5s',
      gracefulStop: '5s',
      iterations: 1,
      vus: 1,
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
  userId: string;
};

export function setup(): TestSetupParams {
  try {
    console.log('running setup()...');

    // Share existing character
    const proxy = new SharedCharacterProxy();
    const character = proxy.getCharacter(existingCharacterTemplateId);
    const { inviteCode } = proxy.shareCharacter({
      characterId: character.id,
      userId: character.userId,
      telliPointsPercentageLimit: 100,
      usageTimeLimitMinutes: 60,
    });

    return { characterId: existingCharacterTemplateId, inviteCode, userId: character.userId };
  } catch (error) {
    console.error('Error in setup():', error);
    exec.test.abort('Setup failed');
    throw error;
  }
}

export function teardown(setupData: TestSetupParams) {
  try {
    console.log('running teardown()...');
    const proxy = new SharedCharacterProxy();
    proxy.unshareCharacter({ characterId: setupData.characterId, userId: setupData.userId });
  } catch (error) {
    console.error('Error in teardown():', error);
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
  });
}
