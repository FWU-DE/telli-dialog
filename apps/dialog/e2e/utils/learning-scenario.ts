import { expect, Page } from '@playwright/test';

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
  const card = page.getByRole('button', { name }).first();
  await expect(card).toBeVisible();
  await card.click();
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
  // Fill name field
  await page
    .getByRole('textbox', { name: 'Name des Lernszenarios' })
    .fill(data?.name ?? 'Absolutismus unter Ludwig XIV – Gruppe 1 Soldaten');

  // Fill description field
  await page
    .getByRole('textbox', { name: 'Kurzbeschreibung' })
    .fill(data?.description ?? 'Zwischen Absolutismus und Demokratie (Ludwig XIV)');

  // Note: schoolType, gradeLevel, and subject fields no longer exist in the new UI
  // They have been consolidated into the instructions field

  // Fill instructions field
  await page
    .getByRole('textbox', { name: 'Instruktionen' })
    .fill(
      data?.additionalInstructions ??
        'Der Chatbot soll aus der Perspektive eines Soldaten im Herrschaftssystem unter Ludwig XIV antworten.',
    );

  // Fill student exercise field
  await page
    .getByRole('textbox', { name: 'Arbeitsauftrag' })
    .fill(
      data?.studentExercise ??
        'Schüler sollen den Unterschied zwischen Absolutismus und Demokratie verstehen.',
    );

  // Wait for autosave to complete (triggered by blur on last field)
  await page.waitForTimeout(500);
  await expect(page.getByText('Gespeichert').first()).toBeVisible({ timeout: 5000 });
}
