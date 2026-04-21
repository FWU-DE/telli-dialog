import { expect, Page } from '@playwright/test';
import { waitForAutosave } from './utils';

export async function configureAssistant(
  page: Page,
  data?: {
    name?: string;
    description?: string;
    instructions?: string;
    promptSuggestions?: string[];
  },
) {
  await page.getByTestId('assistant-name-input').fill(data?.name ?? 'Hausbauplaner');
  await page.getByTestId('assistant-name-input').press('Tab');

  await page
    .getByTestId('assistant-description-input')
    .fill(
      data?.description ??
        'Hilft bei der Planung und Budget Rechnung beim Bau eines Einfamilienhauses',
    );
  await page.getByTestId('assistant-description-input').press('Tab');

  await page
    .getByTestId('assistant-instructions-input')
    .fill(
      data?.instructions ??
        'Die Währung ist US-Dollar, du berätst mich inwiefern sind ein Bausparkredit lohnt',
    );
  await page.getByTestId('assistant-instructions-input').press('Tab');

  const suggestions = data?.promptSuggestions ?? [];
  for (const [index, suggestion] of suggestions.entries()) {
    const slot = index + 1;
    await page.getByTestId(`prompt-suggestion-${slot}-input`).fill(suggestion);
    if (index < suggestions.length - 1) {
      await page.getByTestId(`add-prompt-suggestion-${slot}-button`).click();
    } else {
      await page.getByTestId(`prompt-suggestion-${slot}-input`).press('Tab');
    }
  }

  await waitForAutosave(page);
}

export async function deleteAssistant(page: Page, name: string) {
  const card = page.getByTestId('entity-card').filter({ hasText: name }).first();
  await expect(card).toBeVisible({ timeout: 15000 });
  await card.getByTestId('entity-link').click();
  await page.waitForURL('/assistants/editor/**');
  const deleteButton = page.getByTestId('custom-chat-delete-button').first();
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();
}
