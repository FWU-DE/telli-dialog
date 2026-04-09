import { expect, Page } from '@playwright/test';

export async function deleteCharacter(page: Page, name: string) {
  const card = page.getByRole('button', { name }).first();
  await expect(card).toBeVisible();
  await card.click();
  await page.waitForURL('/characters/editor/**');
  const deleteButton = page.getByTestId('custom-chat-delete-button').first();
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();
}

export async function configureCharacter(
  page: Page,
  data?: {
    name?: string;
    description?: string;
    schoolType?: string;
    gradeLevel?: string;
    subject?: string;
    competence?: string;
    learningContext?: string;
    specifications?: string;
    restrictions?: string;
  },
) {
  await page.getByTestId('character-name-input').fill(data?.name ?? 'John Cena');

  await page
    .getByTestId('character-description-input')
    .fill(
      data?.description ??
        'Er ist bekannt für seinen Spruch „You can`t see me“ und seine Wrestling-Karriere.',
    );

  await page
    .getByTestId('character-instructions-input')
    .fill(data?.specifications ?? 'John Cena soll über seine Karriere und Erfolge sprechen.');
}
