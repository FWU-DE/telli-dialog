import { expect, Page } from '@playwright/test';
import { waitForAutosave } from './utils';

export async function createLearningScenario(page: Page) {
  await page.goto('/learning-scenarios');
  await page.waitForURL('/learning-scenarios');
  await page.getByRole('button', { name: 'Lernszenario erstellen' }).click();
  await page.waitForURL('/learning-scenarios/**');
}

async function confirmDelete(page: Page) {
  const deleteConfirmButton = page.getByRole('button', { name: 'Löschen' });
  await expect(deleteConfirmButton).toBeVisible();
  await deleteConfirmButton.click();
}

export async function deleteLearningScenario(page: Page, name: string) {
  const card = page.getByTestId('entity-card').filter({ hasText: name }).first();
  await expect(card).toBeVisible({ timeout: 15000 });
  await card.getByTestId('entity-link').click();
  await page.waitForURL('/learning-scenarios/editor/**');
  const deleteButton = page.getByTestId('custom-chat-delete-button').first();
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();
  await confirmDelete(page);
}

export async function deleteLearningScenarioFromDetailPage(page: Page) {
  const deleteButton = page.getByTestId('custom-chat-delete-button').first();
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
  // Fill name field and blur for auto-save
  await page
    .getByTestId('learning-scenario-name-input')
    .fill(data?.name ?? 'Absolutismus unter Ludwig XIV – Gruppe 1 Soldaten');
  await page.getByTestId('learning-scenario-name-input').press('Tab');

  // Fill description field
  await page
    .getByTestId('learning-scenario-description-input')
    .fill(data?.description ?? 'Zwischen Absolutismus und Demokratie (Ludwig XIV)');

  // Note: schoolType, gradeLevel, and subject fields no longer exist in the new UI
  // They have been consolidated into the instructions field

  // Fill instructions field
  await page
    .getByTestId('learning-scenario-instructions-input')
    .fill(
      data?.additionalInstructions ??
        'Der Chatbot soll aus der Perspektive eines Soldaten im Herrschaftssystem unter Ludwig XIV antworten.',
    );

  // Fill student exercise field
  await page
    .getByTestId('learning-scenario-student-exercise-input')
    .fill(
      data?.studentExercise ??
        'Schüler sollen den Unterschied zwischen Absolutismus und Demokratie verstehen.',
    );

  await page.getByTestId('custom-chat-save-button').first().click();
  await waitForAutosave(page);
}
