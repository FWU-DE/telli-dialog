import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { configureCharacter } from '../../utils/character';
import { nanoid } from 'nanoid';

const characterName = 'Ada Lovelace - ' + nanoid(8);

test.describe('share character school-wide', () => {
  test.use({ storageState: AUTH_FILES.teacher2 });

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage({ storageState: AUTH_FILES.teacher });

    await page.goto('/characters');
    await page.waitForURL('/characters**');

    const createButton = page.getByRole('button', { name: 'Dialogpartner erstellen' });
    await expect(createButton).toBeVisible();
    await createButton.click();

    await page.waitForURL('/characters/editor/**');

    await page.getByRole('checkbox', { name: 'Schulintern' }).click();

    await configureCharacter(page, {
      name: characterName,
      description: 'Sie gilt als erste Programmiererin der Welt.',
      instructions: 'Ada Lovelace soll kindgerecht und verständlich antworten.',
    });

    await page.close();
  });

  test('shared character is visible for teacher2', async ({ page }) => {
    await page.goto('/characters');
    await page.waitForURL('/characters**');

    await expect(page.getByText(characterName).first()).toBeVisible();
  });
});
