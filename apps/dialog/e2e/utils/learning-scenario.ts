import { expect, Page } from '@playwright/test';

export async function createLearningScenario(page: Page) {
  await page.goto('/learning-scenarios');
  await page.waitForURL('/learning-scenarios');
  await page.getByRole('button', { name: 'Szenario erstellen' }).click();
  await page.waitForURL('/learning-scenarios/**');
}

async function confirmDelete(page: Page) {
  const deleteConfirmButton = page.getByRole('button', { name: 'Löschen' });
  await expect(deleteConfirmButton).toBeVisible();
  await deleteConfirmButton.click();
}

export async function deleteLearningScenario(page: Page, name: string) {
  const deleteButton = page
    .locator('a', { has: page.locator('> figure') })
    .filter({ hasText: name })
    .getByLabel('Löschen')
    .first();
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();
  await confirmDelete(page);
}

export async function deleteLearningScenarioFromDetailPage(page: Page) {
  const deleteButton = page.getByRole('button', { name: 'Szenario endgültig löschen' });
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();
  await confirmDelete(page);
}

export async function configureLearningScenario(
  page: Page,
  data?: {
    name?: string;
    description?: string;
    schoolType?: string;
    gradeLevel?: string;
    subject?: string;
    studentExercise?: string;
    additionalInstructions?: string;
  },
) {
  await page
    .getByLabel('Wie heißt das Szenario?')
    .fill(data?.name ?? 'Absolutismus unter Ludwig XIV – Gruppe 1 Soldaten');

  await page
    .getByLabel('Wie kann das Szenario kurz beschrieben werden?')
    .fill(data?.description ?? 'Zwischen Absolutismus und Demokratie (Ludwig XIV)');

  await page.getByLabel('Schultyp').fill(data?.schoolType ?? 'Gymnasium');
  await page.getByLabel('Klassenstufe').fill(data?.gradeLevel ?? '10. Klasse');
  await page.getByLabel('Fach').fill(data?.subject ?? 'Geschichte');

  await page
    .getByLabel('Wie lautet der Auftrag an die Lernenden?')
    .fill(
      data?.studentExercise ??
        'Schüler sollen den Unterschied zwischen Absolutismus und Demokratie verstehen.',
    );

  await page
    .getByLabel('Wie verhält sich telli im Lernszenario? *')
    .fill(
      data?.additionalInstructions ??
        'Der Chatbot soll aus der Perspektive eines Soldaten im Herrschaftssystem unter Ludwig XIV antworten.',
    );
}
