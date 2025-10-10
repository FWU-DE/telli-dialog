import test, { expect } from '@playwright/test';
import { authorizationHeader } from '../../../../../utils/authorizationHeader';
import { login } from '../../../../../utils/login';
import type { Page } from 'playwright-core';
import { db } from '@/db';
import { federalStateTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

const deleteConversationRoute = '/api/v1/admin/delete-conversation';

test.describe('with chat_storage_time=0', () => {
  let original: number | undefined = undefined;

  test.beforeEach(async ({ page }) => {
    await createGenericChatWithFileAttachment(page);
    original = (
      await db
        .select({ chatStorageTime: federalStateTable.chatStorageTime })
        .from(federalStateTable)
        .where(eq(federalStateTable.id, 'DE-BY'))
    )[0]?.chatStorageTime;

    await db
      .update(federalStateTable)
      .set({ chatStorageTime: 0 })
      .where(eq(federalStateTable.id, 'DE-BY'));
  });

  test.afterEach(async () => {
    await db
      .update(federalStateTable)
      .set({ chatStorageTime: original ?? 90 })
      .where(eq(federalStateTable.id, 'DE-BY'));
  });

  test('should delete old conversations', async ({ request }) => {
    // Delete
    const response = await request.delete(deleteConversationRoute, {
      headers: authorizationHeader,
    });

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.countDeletedConversations).toBeGreaterThanOrEqual(1);
  });
});

test('should return 403 if authorization header is missing', async ({ request }) => {
  const response = await request.delete(deleteConversationRoute);
  expect(response.status()).toBe(403);
});

async function createGenericChatWithFileAttachment(page: Page) {
  await login(page, 'teacher1-BY');

  const fileInput = page.locator('input[type="file"]');
  const filePath = './e2e/fixtures/file-upload/Große Text Datei.txt';

  await fileInput.setInputFiles(filePath);
  const result = await page.waitForResponse('/api/v1/files');
  expect(result.status()).toBe(200);

  const messageInput = page.getByRole('textbox', { name: 'Wie kann ich Dir helfen?' });
  await messageInput.click();
  await messageInput.fill('Gib "OK" aus.');
  await page.getByRole('button', { name: 'Nachricht abschicken' }).click();

  await page.waitForResponse('/d/**');
}
