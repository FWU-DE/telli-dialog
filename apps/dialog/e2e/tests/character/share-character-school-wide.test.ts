import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { configureCharacter } from '../../utils/character';
import { nanoid } from 'nanoid';

test('share character school-wide', async ({ page }) => {
  await login(page, 'teacher');
  await page.goto('/characters');
  await page.waitForURL('/characters**');

  const createButton = page.getByRole('button', { name: 'Dialogpartner erstellen' });
  await expect(createButton).toBeVisible();
  await createButton.click();

  await page.waitForURL('/characters/editor/**');

  await page.getByRole('checkbox', { name: 'Schulintern' }).click();

  // configure form
  const characterName = 'Ada Lovelace - ' + nanoid(8);
  await configureCharacter(page, {
    name: characterName,
    description: 'Sie gilt als erste Programmiererin der Welt.',
    instructions: 'Ada Lovelace soll kindgerecht und verständlich antworten.',
  });

  await page.goto('/characters?visibility=school**');

  // Login as a different teacher to verify sharing
  await login(page, 'teacher2');
  await page.goto('/characters?visibility=school');
  await page.waitForURL('/characters?visibility=school**');

  // Verify the shared character is visible
  await expect(page.getByText(characterName).first()).toBeVisible();
});
