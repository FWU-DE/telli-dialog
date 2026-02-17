import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { waitForToast } from '../../utils/utils';

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
  await page.getByLabel('Schultyp').fill('Grundschule');
  await page.getByLabel('Klassenstufe').fill('4. Klasse');
  await page.getByLabel('Fach').fill('Mathematik');

  await page.getByLabel('Wie heißt die simulierte Person? *').fill('Ada Lovelace');

  await page
    .getByLabel('Wie kann die simulierte Person kurz beschrieben werden? *')
    .fill('Sie gilt als erste Programmiererin der Welt.');

  await page
    .getByLabel('Welche Kompetenzen sollen die Lernenden erwerben? *')
    .fill('Grundverständnis für Algorithmen');

  await page
    .getByLabel('Was ist die konkrete Unterrichtssituation? *')
    .fill('Ein Gespräch über das Lösen von Rechenaufgaben.');

  await page
    .getByLabel('Wie soll der Dialogpartner antworten?')
    .fill('Ada Lovelace soll kindgerecht und verständlich antworten.');

  await page
    .getByLabel('Wie soll der Dialogpartner nicht antworten?')
    .fill('Ada Lovelace soll keine komplizierten Fachbegriffe verwenden.');

  const submitButton = page.getByRole('button', { name: 'Dialogpartner erstellen' });
  await submitButton.scrollIntoViewIfNeeded();
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
  await waitForToast(page);
  await page.waitForURL('/characters?visibility=school**');

  // Login as a different teacher to verify sharing
  await login(page, 'teacher2');
  await page.goto('/characters?visibility=school');
  await page.waitForURL('/characters?visibility=school**');

  // Verify the shared character is visible
  await expect(page.getByText('Ada Lovelace').first()).toBeVisible();
});
