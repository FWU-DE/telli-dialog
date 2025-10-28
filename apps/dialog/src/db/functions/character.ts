import { and, desc, eq, getTableColumns, inArray, isNull, or } from 'drizzle-orm';
import { db } from '..';
import {
  CharacterFileMapping,
  CharacterInsertModel,
  CharacterModel,
  characterTable,
  conversationMessageTable,
  conversationTable,
  fileTable,
  SharedCharacterChatUsageTrackingInsertModel,
  sharedCharacterChatUsageTrackingTable,
  sharedCharacterConversation,
  TextChunkTable,
} from '../schema';
import { dbGetModelByName } from './llm-model';
import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';

export async function dbGetCharacterByIdOrSchoolId({
  characterId,
  userId,
  schoolId,
}: {
  characterId: string;
  userId: string;
  schoolId: string | null;
}) {
  const [character] = await db
    .select()
    .from(characterTable)
    .where(
      or(
        and(
          eq(characterTable.id, characterId),
          eq(characterTable.userId, userId),
          eq(characterTable.accessLevel, 'private'),
        ),
        schoolId !== null
          ? and(
              eq(characterTable.id, characterId),
              eq(characterTable.schoolId, schoolId),
              eq(characterTable.accessLevel, 'school'),
            )
          : undefined,
        eq(characterTable.accessLevel, 'global'),
      ),
    );
  return character;
}

/**
 * needs userId because the meta data for shared chararters are both tied to the user and character, this is especially important for shared charcters (school wide or global)
 */
export async function dbGetCharacterByIdWithShareData({
  characterId,
  userId,
}: {
  characterId: string;
  userId: string;
}) {
  const [row] = await db
    .select({
      ...getTableColumns(characterTable),
      intelligencePointsLimit: sharedCharacterConversation.intelligencePointsLimit,
      inviteCode: sharedCharacterConversation.inviteCode,
      maxUsageTimeLimit: sharedCharacterConversation.maxUsageTimeLimit,
      startedAt: sharedCharacterConversation.startedAt,
    })
    .from(characterTable)
    .leftJoin(
      sharedCharacterConversation,
      and(
        eq(sharedCharacterConversation.characterId, characterId),
        eq(sharedCharacterConversation.userId, userId),
      ),
    )
    .where(eq(characterTable.id, characterId));
  return row;
}

/**
 * The returned entity has no Shared Data Attached! These are found in the SharedCharacterConversation Table
 */
export async function dbGetCharacterById({ characterId }: { characterId: string }) {
  const [row] = await db.select().from(characterTable).where(eq(characterTable.id, characterId));
  return row;
}

export async function dbGetCopyTemplateCharacter({
  templateId,
  characterId,
  userId,
}: {
  templateId: string;
  characterId: string;
  userId: string;
}): Promise<Omit<CharacterInsertModel, 'modelId'>> {
  const character = await dbGetCharacterByIdWithShareData({ characterId: templateId, userId });
  if (character?.name === undefined) {
    throw new Error('Invalid State Template Character must have a name');
  }
  return {
    ...character,
    id: characterId,
    accessLevel: 'private',
    userId,
  };
}

export async function dbCreateCharacter(character: Omit<CharacterInsertModel, 'modelId'> & Partial<Pick<CharacterInsertModel, 'modelId'>>) {
  const defaultModelId = (await dbGetModelByName(DEFAULT_CHAT_MODEL))?.id;
  const modelId = character.modelId ?? defaultModelId;
  if (!modelId) {
    throw new Error('No default model found');
  }
  const created = await db
    .insert(characterTable)
    .values({ ...character, modelId })
    .onConflictDoUpdate({ target: characterTable.id, set: { ...character } })
    .returning();
  return created;
}

export async function dbGetGlobalCharacters({
  userId,
}: {
  userId: string;
}): Promise<CharacterModel[]> {
  const characters = await db
    .select({
      ...getTableColumns(characterTable),
      intelligencePointsLimit: sharedCharacterConversation.intelligencePointsLimit,
      inviteCode: sharedCharacterConversation.inviteCode,
      maxUsageTimeLimit: sharedCharacterConversation.maxUsageTimeLimit,
      startedAt: sharedCharacterConversation.startedAt,
    })
    .from(characterTable)
    .leftJoin(
      sharedCharacterConversation,
      and(
        eq(sharedCharacterConversation.characterId, characterTable.id),
        eq(sharedCharacterConversation.userId, userId),
      ),
    )
    .where(
      and(
        eq(characterTable.accessLevel, 'global'),
        or(
          eq(sharedCharacterConversation.userId, userId),
          isNull(sharedCharacterConversation.userId),
        ),
      ),
    )
    .orderBy(desc(characterTable.createdAt));

  return characters;
}

export async function dbGetCharactersBySchoolId({
  schoolId,
  userId,
}: {
  schoolId: string;
  userId: string;
}): Promise<CharacterModel[]> {
  const characters = await db
    .select({
      ...getTableColumns(characterTable),
      intelligencePointsLimit: sharedCharacterConversation.intelligencePointsLimit,
      inviteCode: sharedCharacterConversation.inviteCode,
      maxUsageTimeLimit: sharedCharacterConversation.maxUsageTimeLimit,
      startedAt: sharedCharacterConversation.startedAt,
    })
    .from(characterTable)
    .leftJoin(
      sharedCharacterConversation,
      eq(sharedCharacterConversation.characterId, characterTable.id),
    )
    .where(
      and(
        eq(characterTable.schoolId, schoolId),
        eq(characterTable.accessLevel, 'school'),
        or(
          eq(sharedCharacterConversation.userId, userId),
          isNull(sharedCharacterConversation.userId),
        ),
      ),
    )
    .orderBy(desc(characterTable.createdAt));

  return characters;
}

export async function dbGetCharactersByUserId({
  userId,
}: {
  userId: string;
}): Promise<CharacterModel[]> {
  const characters = await db
    .select({
      ...getTableColumns(characterTable),
      intelligencePointsLimit: sharedCharacterConversation.intelligencePointsLimit,
      inviteCode: sharedCharacterConversation.inviteCode,
      maxUsageTimeLimit: sharedCharacterConversation.maxUsageTimeLimit,
      startedAt: sharedCharacterConversation.startedAt,
    })
    .from(characterTable)
    .leftJoin(
      sharedCharacterConversation,
      eq(sharedCharacterConversation.characterId, characterTable.id),
    )
    .where(and(eq(characterTable.userId, userId), eq(characterTable.accessLevel, 'private')))
    .orderBy(desc(characterTable.createdAt));

  return characters;
}

export async function dbGetCharacterByIdAndUserId({
  characterId,
  userId,
}: {
  characterId: string;
  userId: string;
}): Promise<CharacterModel | undefined> {
  const [row] = await db
    .select({
      ...getTableColumns(characterTable),
      intelligencePointsLimit: sharedCharacterConversation.intelligencePointsLimit,
      inviteCode: sharedCharacterConversation.inviteCode,
      maxUsageTimeLimit: sharedCharacterConversation.maxUsageTimeLimit,
      startedAt: sharedCharacterConversation.startedAt,
    })
    .from(characterTable)
    .leftJoin(
      sharedCharacterConversation,
      and(
        eq(sharedCharacterConversation.characterId, characterId),
        eq(sharedCharacterConversation.userId, userId),
      ),
    )
    .where(and(eq(characterTable.id, characterId), eq(sharedCharacterConversation.userId, userId)));
  //.where(and(eq(characterTable.id, characterId), eq(characterTable.userId, userId)));
  return row;
}

export async function dbDeleteCharacterByIdAndUserId({
  characterId,
  userId,
}: {
  characterId: string;
  userId: string;
}) {
  const [character] = await db
    .select()
    .from(characterTable)
    .where(and(eq(characterTable.id, characterId), eq(characterTable.userId, userId)));

  if (character === undefined) {
    throw Error('Character does not exist');
  }

  const deletedCharacter = await db.transaction(async (tx) => {
    const relatedFiles = await tx
      .select({ id: CharacterFileMapping.fileId })
      .from(CharacterFileMapping)
      .where(eq(CharacterFileMapping.characterId, character.id));

    const conversations = await tx
      .select({ id: conversationTable.id })
      .from(conversationTable)
      .where(eq(conversationTable.characterId, character.id));

    if (conversations.length > 0) {
      await tx.delete(conversationMessageTable).where(
        inArray(
          conversationMessageTable.conversationId,
          conversations.map((c) => c.id),
        ),
      );
    }
    await tx.delete(conversationTable).where(eq(conversationTable.characterId, character.id));
    await tx.delete(CharacterFileMapping).where(eq(CharacterFileMapping.characterId, character.id));
    await tx.delete(TextChunkTable).where(
      inArray(
        TextChunkTable.fileId,
        relatedFiles.map((f) => f.id),
      ),
    );
    await tx.delete(fileTable).where(
      inArray(
        fileTable.id,
        relatedFiles.map((f) => f.id),
      ),
    );
    const deletedCharacter = (
      await tx
        .delete(characterTable)
        .where(and(eq(characterTable.id, characterId), eq(characterTable.userId, userId)))
        .returning()
    )[0];

    if (deletedCharacter === undefined) {
      throw Error('Could not delete character');
    }
    return deletedCharacter;
  });

  return deletedCharacter;
}

export async function dbGetCharacterByIdAndInviteCode({
  id,
  inviteCode,
}: {
  id: string;
  inviteCode: string;
}): Promise<CharacterModel | undefined> {
  const [row] = await db
    .select({
      ...getTableColumns(characterTable),
      userId: sharedCharacterConversation.userId,
      intelligencePointsLimit: sharedCharacterConversation.intelligencePointsLimit,
      inviteCode: sharedCharacterConversation.inviteCode,
      maxUsageTimeLimit: sharedCharacterConversation.maxUsageTimeLimit,
      startedAt: sharedCharacterConversation.startedAt,
    })
    .from(characterTable)
    .leftJoin(
      sharedCharacterConversation,
      eq(sharedCharacterConversation.characterId, characterTable.id),
    )
    .where(and(eq(characterTable.id, id), eq(sharedCharacterConversation.inviteCode, inviteCode)));

  // if the character is not shared, return the character
  if (row === undefined) {
    const [row] = await db
      .select()
      .from(characterTable)
      .where(and(eq(characterTable.id, id)));
    return row;
  }
  return row as CharacterModel;
}

export async function dbUpdateTokenUsageByCharacterChatId(
  value: SharedCharacterChatUsageTrackingInsertModel,
) {
  const insertedUsage = (
    await db.insert(sharedCharacterChatUsageTrackingTable).values(value).returning()
  )[0];
  if (insertedUsage === undefined) {
    throw Error('Could not track the token usage');
  }

  return insertedUsage;
}

export async function dbGetCharacterByNameAndUserId({
  name,
  userId,
}: {
  name: string;
  userId: string;
}): Promise<CharacterModel | undefined> {
  const [character] = await db
    .select()
    .from(characterTable)
    .where(and(eq(characterTable.name, name), eq(characterTable.userId, userId)));
  return character;
}

export async function dbGetGlobalCharacterByName({
  name,
}: {
  name: string;
}): Promise<CharacterModel | undefined> {
  const [character] = await db
    .select()
    .from(characterTable)
    .where(and(eq(characterTable.name, name), eq(characterTable.accessLevel, 'global')));
  return character;
}
