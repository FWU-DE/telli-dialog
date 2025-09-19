import { test, expect } from '@playwright/test';
import { login } from '../../utils/login';

test('teacher can share character school-wide', async ({ page }) => {
  await login(page, 'teacher1-BY');
  await page.goto('/characters');
  await page.waitForURL('/characters**');

  const createButton = page.getByRole('button', { name: 'Dialogpartner erstellen' });
  await expect(createButton).toBeVisible();
  await createButton.click();

  await page.waitForURL('/characters/editor/**');

  await page.getByRole('checkbox', { name: 'schulintern freigeben' }).click();

  // configure form
  await page.getByLabel('Schultyp').fill('Grundschule');
  await page.getByLabel('Klassenstufe').fill('4. Klasse');
  await page.getByLabel('Fach').fill('Mathematik');

  await page.getByLabel('Wie heißt die Rolle/Simulierte Person? *').fill('Ada Lovelace');

  await page
    .getByLabel('Wie kann die Rolle/Simulierte Person in einem kurzen Satz beschrieben werden? *')
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
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  // Delete cookies to simulate a new session
  await page.context().clearCookies();

  // Login as a different teacher to verify sharing
  await login(page, 'teacher2-BY');
  await page.goto('/characters?visibility=school');
  await page.waitForURL('/characters?visibility=school**');

  // Verify the shared character is visible
  await expect(page.getByText('Ada Lovelace').first()).toBeVisible();
});
