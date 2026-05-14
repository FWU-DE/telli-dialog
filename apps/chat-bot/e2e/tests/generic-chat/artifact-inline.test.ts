import { expect, test } from '@playwright/test';
import { AUTH_FILES, E2E_FEDERAL_STATE } from '../../utils/const';
import { db } from '@shared/db';
import { conversationTable, userTable } from '@shared/db/schema';
import { dbInsertArtifact, dbInsertArtifactVersion } from '@shared/db/functions/artifacts';
import { dbInsertChatContent } from '@shared/db/functions/chat';
import { generateUUID } from '@shared/utils/uuid';
import { eq, and } from 'drizzle-orm';

test.use({ storageState: AUTH_FILES.teacher });

const SAMPLE_HTML = `<!DOCTYPE html>
<html>
<head><title>Artifact Test</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f0f4ff">
  <div style="text-align:center">
    <h1 style="color:#4f46e5">Artifact Inline Test</h1>
    <p>This is a test artifact rendered inline above the input.</p>
  </div>
</body>
</html>`;

async function getTeacherUserId(): Promise<string> {
  const users = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(and(eq(userTable.federalStateId, E2E_FEDERAL_STATE), eq(userTable.userRole, 'teacher')))
    .limit(1);

  const userId = users[0]?.id;
  if (!userId) throw new Error(`No teacher user found for federal state ${E2E_FEDERAL_STATE}`);
  return userId;
}

test('inline artifact preview renders when conversation has an artifact', async ({ page }) => {
  const userId = await getTeacherUserId();
  const conversationId = generateUUID();
  const messageId = generateUUID();

  await db.insert(conversationTable).values({ id: conversationId, userId });
  await dbInsertChatContent({
    id: messageId,
    conversationId,
    content: 'Here is your HTML app.',
    role: 'assistant',
    userId,
    modelName: 'test-model',
    orderNumber: 1,
  });

  const artifact = await dbInsertArtifact({
    conversationId,
    title: 'Artifact Inline Test',
  });
  await dbInsertArtifactVersion({
    artifactId: artifact.id,
    messageId,
    content: SAMPLE_HTML,
    versionNumber: 1,
  });

  await page.goto(`/d/${conversationId}`);

  const iframe = page.locator('iframe[title="Artifact-Vorschau"]');
  await expect(iframe).toBeVisible({ timeout: 10_000 });
});
