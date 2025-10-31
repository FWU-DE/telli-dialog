import test, { expect } from '@playwright/test';
import { db } from '@shared/db';
import {
  conversationUsageTracking,
  sharedSchoolConversationUsageTracking,
  sharedCharacterChatUsageTrackingTable,
  llmModelTable,
  sharedSchoolConversationTable,
  userTable,
} from '@shared/db/schema';
import { getPriceInCentByUser } from '@/app/school';
import { UserAndContext } from '@/auth/types';
import {
  sharedCharacterChatHasReachedIntelliPointLimit,
  sharedChatHasReachedIntelliPointLimit,
} from '@/app/api/chat/usage';
import {
  dbGetSharedCharacterChatUsageInCentByCharacterId,
  dbGetSharedChatUsageInCentBySharedChatId,
} from '@shared/db/functions/intelli-points';
import {
  mockCharacter,
  mockConversationUsage,
  mockLlmModel,
  mockSharedCharacterChatUsage,
  mockSharedSchoolConversation,
  mockSharedSchoolConversationUsage,
  mockUserAndContext,
} from '../../../../utils/mock';

test.describe('costs', () => {
  test('should calculate total price from all three usage tracking tables', async () => {
    const user = mockUserAndContext();

    const model = mockLlmModel();
    await db.insert(llmModelTable).values(model);

    for (let i = 0; i < 2; i++) {
      const conversationUsage = {
        ...mockConversationUsage(),
        userId: user.id,
        modelId: model.id,
        costsInCent: 150,
      };

      const sharedSchoolConversationUsage = {
        ...mockSharedSchoolConversationUsage(),
        userId: user.id,
        modelId: model.id,
        costsInCent: 200,
      };

      const sharedCharacterChatUsage = {
        ...mockSharedCharacterChatUsage(),
        userId: user.id,
        modelId: model.id,
        costsInCent: 300,
      };

      await db.insert(conversationUsageTracking).values(conversationUsage);
      await db.insert(sharedSchoolConversationUsageTracking).values(sharedSchoolConversationUsage);
      await db.insert(sharedCharacterChatUsageTrackingTable).values(sharedCharacterChatUsage);
    }

    const priceInCent = await getPriceInCentByUser(user as UserAndContext);

    // Expected total costs: (150 + 200 + 300)*2 = 1300 cents
    expect(priceInCent).toBe(1300);
  });

  test('should return 0 if no usage data exists for user', async () => {
    const user = mockUserAndContext();

    const priceInCent = await getPriceInCentByUser(user);

    expect(priceInCent).toBe(0);
  });

  test('shared chat - should correctly compute telli points limit', async () => {
    const maxUsageTimeLimit = 45;
    const teacherPriceLimit = 1000; // 1000 cents
    const intelligencePointsLimit = 10; // 10% = 100 cents

    let user = mockUserAndContext();
    user = {
      ...user,
      federalState: { ...user.federalState, teacherPriceLimit: teacherPriceLimit },
    };
    await db.insert(userTable).values(user);

    const model = mockLlmModel();
    await db.insert(llmModelTable).values(model);

    // create shared school conversation
    const sharedSchoolConversation = {
      ...mockSharedSchoolConversation(),
      intelligencePointsLimit: intelligencePointsLimit,
      maxUsageTimeLimit: maxUsageTimeLimit,
      userId: user.id,
      modelId: model.id,
    };
    await db.insert(sharedSchoolConversationTable).values(sharedSchoolConversation);

    // Insert data into shared school conversation usage tracking (30*3 = 90 cents)
    for (let i = 0; i < 3; i++) {
      const sharedSchoolConversationUsage = {
        ...mockSharedSchoolConversationUsage(),
        userId: user.id,
        modelId: model.id,
        sharedSchoolConversationId: sharedSchoolConversation.id,
        costsInCent: 30,
      };

      await db.insert(sharedSchoolConversationUsageTracking).values(sharedSchoolConversationUsage);
    }

    const sharedChatUsageInCent = await dbGetSharedChatUsageInCentBySharedChatId({
      sharedChatId: sharedSchoolConversation.id,
      maxUsageTimeLimit: sharedSchoolConversation.maxUsageTimeLimit!,
      startedAt: sharedSchoolConversation.startedAt!,
    });

    expect(sharedChatUsageInCent).toBe(90);

    let hasReachedLimit = await sharedChatHasReachedIntelliPointLimit({
      user: user,
      sharedChat: sharedSchoolConversation,
    });

    // Used 90 cents of 100 cents -> under the limit
    expect(hasReachedLimit).toBe(false);

    // Add another 30 cents - now 120 cents used
    const sharedSchoolConversationUsage = {
      ...mockSharedSchoolConversationUsage(),
      userId: user.id,
      modelId: model.id,
      sharedSchoolConversationId: sharedSchoolConversation.id,
      costsInCent: 30,
    };
    await db.insert(sharedSchoolConversationUsageTracking).values(sharedSchoolConversationUsage);

    hasReachedLimit = await sharedChatHasReachedIntelliPointLimit({
      user: user,
      sharedChat: sharedSchoolConversation,
    });

    // Used 120 cents of 100 cents -> over the limit
    expect(hasReachedLimit).toBe(true);
  });

  test('shared character chat - should correctly compute telli points limit', async () => {
    const maxUsageTimeLimit = 45;
    const teacherPriceLimit = 1000; // 1000 cents
    const intelligencePointsLimit = 10; // 10% = 100 cents

    let user = mockUserAndContext();
    user = {
      ...user,
      federalState: { ...user.federalState, teacherPriceLimit: teacherPriceLimit },
    };
    await db.insert(userTable).values(user);

    const model = mockLlmModel();
    await db.insert(llmModelTable).values(model);

    const character = {
      ...mockCharacter(),
      maxUsageTimeLimit: maxUsageTimeLimit,
      intelligencePointsLimit: intelligencePointsLimit,
      userId: user.id,
      modelId: model.id,
    };

    // Insert data into shared character conversation usage tracking (30*3 = 90 cents)
    for (let i = 0; i < 3; i++) {
      const sharedCharacterChatUsage = {
        ...mockSharedCharacterChatUsage(),
        userId: user.id,
        modelId: model.id,
        costsInCent: 30,
        characterId: character.id,
      };

      await db.insert(sharedCharacterChatUsageTrackingTable).values(sharedCharacterChatUsage);
    }

    const sharedChatUsageInCent = await dbGetSharedCharacterChatUsageInCentByCharacterId({
      characterId: character.id,
      maxUsageTimeLimit: character.maxUsageTimeLimit!,
      startedAt: character.startedAt!,
    });

    expect(sharedChatUsageInCent).toBe(90);

    let hasReachedLimit = await sharedCharacterChatHasReachedIntelliPointLimit({
      user: user,
      character: character,
    });

    // Used 90 cents of 100 cents -> under the limit
    expect(hasReachedLimit).toBe(false);

    // Add another 30 cents - now 120 cents used
    const sharedCharacterChatUsage = {
      ...mockSharedCharacterChatUsage(),
      userId: user.id,
      modelId: model.id,
      costsInCent: 30,
      characterId: character.id,
    };
    await db.insert(sharedCharacterChatUsageTrackingTable).values(sharedCharacterChatUsage);

    hasReachedLimit = await sharedCharacterChatHasReachedIntelliPointLimit({
      user: user,
      character: character,
    });

    // Used 120 cents of 100 cents -> over the limit
    expect(hasReachedLimit).toBe(true);
  });
});
