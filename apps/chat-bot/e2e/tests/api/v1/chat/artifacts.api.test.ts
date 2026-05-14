import { expect, test } from '@playwright/test';
import { db } from '@shared/db';
import { conversationTable, userTable, llmModelTable } from '@shared/db/schema';
import {
  dbInsertArtifact,
  dbInsertArtifactVersion,
  dbGetLatestArtifactVersionByConversationId,
  dbGetArtifactByConversationId,
  dbGetLatestVersionNumberByArtifactId,
} from '@shared/db/functions/artifacts';
import { dbInsertChatContent } from '@shared/db/functions/chat';
import { mockLlmModel, mockUserAndContext } from '../../../../utils/mock';
import { generateUUID } from '@shared/utils/uuid';

const SAMPLE_HTML = '<!DOCTYPE html><html><body><h1>Hello World</h1></body></html>';
const UPDATED_HTML = '<!DOCTYPE html><html><body><h1>Updated</h1></body></html>';

test.describe('artifact DB functions', () => {
  test('inserts an artifact and retrieves the latest version', async () => {
    const user = mockUserAndContext();
    const model = mockLlmModel();

    await db.insert(userTable).values({
      id: user.id,
      schoolIds: user.schoolIds,
      federalStateId: user.federalStateId,
      userRole: user.userRole,
    });
    await db.insert(llmModelTable).values(model);

    const conversationId = generateUUID();
    await db.insert(conversationTable).values({
      id: conversationId,
      userId: user.id,
    });

    const messageId = generateUUID();
    await dbInsertChatContent({
      id: messageId,
      conversationId,
      content: 'Here is your app.',
      role: 'assistant',
      userId: user.id,
      modelName: model.name,
      orderNumber: 1,
    });

    const artifact = await dbInsertArtifact({
      conversationId,
      title: 'Hello World App',
    });

    await dbInsertArtifactVersion({
      artifactId: artifact.id,
      messageId,
      content: SAMPLE_HTML,
      versionNumber: 1,
    });

    const latest = await dbGetLatestArtifactVersionByConversationId(conversationId);

    expect(latest).toBeDefined();
    expect(latest?.content).toBe(SAMPLE_HTML);
    expect(latest?.artifactTitle).toBe('Hello World App');
    expect(latest?.versionNumber).toBe(1);
  });

  test('tracks version numbers correctly across multiple updates', async () => {
    const user = mockUserAndContext();
    const model = mockLlmModel();

    await db.insert(userTable).values({
      id: user.id,
      schoolIds: user.schoolIds,
      federalStateId: user.federalStateId,
      userRole: user.userRole,
    });
    await db.insert(llmModelTable).values(model);

    const conversationId = generateUUID();
    await db.insert(conversationTable).values({
      id: conversationId,
      userId: user.id,
    });

    const artifact = await dbInsertArtifact({ conversationId, title: 'Counter App' });

    for (let i = 1; i <= 3; i++) {
      const messageId = generateUUID();
      await dbInsertChatContent({
        id: messageId,
        conversationId,
        content: `Version ${i}`,
        role: 'assistant',
        userId: user.id,
        modelName: model.name,
        orderNumber: i,
      });
      const nextVersion = (await dbGetLatestVersionNumberByArtifactId(artifact.id)) + 1;
      await dbInsertArtifactVersion({
        artifactId: artifact.id,
        messageId,
        content: i === 3 ? UPDATED_HTML : SAMPLE_HTML,
        versionNumber: nextVersion,
      });
    }

    const latest = await dbGetLatestArtifactVersionByConversationId(conversationId);
    expect(latest?.versionNumber).toBe(3);
    expect(latest?.content).toBe(UPDATED_HTML);
  });

  test('returns undefined for conversation without an artifact', async () => {
    const result = await dbGetLatestArtifactVersionByConversationId(generateUUID());
    expect(result).toBeUndefined();
  });

  test('dbGetArtifactByConversationId finds existing artifact', async () => {
    const user = mockUserAndContext();
    await db.insert(userTable).values({
      id: user.id,
      schoolIds: user.schoolIds,
      federalStateId: user.federalStateId,
      userRole: user.userRole,
    });

    const conversationId = generateUUID();
    await db.insert(conversationTable).values({ id: conversationId, userId: user.id });

    await dbInsertArtifact({ conversationId, title: 'My App' });

    const found = await dbGetArtifactByConversationId(conversationId);
    expect(found).toBeDefined();
    expect(found?.title).toBe('My App');
    expect(found?.conversationId).toBe(conversationId);
  });

  test('dbGetArtifactByConversationId returns undefined for unknown conversation', async () => {
    const result = await dbGetArtifactByConversationId(generateUUID());
    expect(result).toBeUndefined();
  });
});
