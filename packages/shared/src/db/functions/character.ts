import {
  and,
  arrayOverlaps,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNull,
  or,
  sql,
} from 'drizzle-orm';
import { db } from '..';
import {
  CharacterFileMapping,
  CharacterInsertModel,
  CharacterOptionalShareDataModel,
  CharacterSelectModel,
  characterTable,
  characterTemplateMappingTable,
  CharacterWithShareDataModel,
  conversationMessageTable,
  conversationTable,
  fileTable,
  SharedCharacterChatUsageTrackingInsertModel,
  sharedCharacterChatUsageTrackingTable,
  sharedCharacterConversation,
  userTable,
} from '../schema';
import { dbGetModelByName } from './llm-model';
import { DEFAULT_CHAT_MODEL } from '@shared/llm-models/default-llm-models';
import { UserModel } from '@shared/auth/user-model';

function baseCharacterQuery() {
  return db
    .select({
      ...getTableColumns(characterTable),
      ownerSchoolIds: sql<string[]>`coalesce(${userTable.schoolIds}, '{}'::text[])`,
    })
    .from(characterTable)
    .leftJoin(userTable, eq(characterTable.userId, userTable.id));
}

function baseCharacterWithShareQuery() {
  return db
    .select({
      ...getTableColumns(characterTable),
      telliPointsLimit: sharedCharacterConversation.telliPointsLimit,
      inviteCode: sharedCharacterConversation.inviteCode,
      maxUsageTimeLimit: sharedCharacterConversation.maxUsageTimeLimit,
      startedAt: sharedCharacterConversation.startedAt,
      manuallyStoppedAt: sharedCharacterConversation.manuallyStoppedAt,
      startedBy: sharedCharacterConversation.userId,
      ownerSchoolIds: sql<string[]>`coalesce(${userTable.schoolIds}, '{}'::text[])`,
    })
    .from(characterTable)
    .leftJoin(userTable, eq(characterTable.userId, userTable.id));
}

/**
 * Get all characters a user is allowed to see:
 * - user is owner of character
 * - character is shared with users school
 * - character is global
 * - character is not deleted
 */
export async function dbGetCharacters({
  user,
}: {
  user: Pick<UserModel, 'id' | 'schoolIds'>;
}): Promise<CharacterSelectModel[]> {
  const schoolCondition =
    user.schoolIds.length > 0
      ? and(
          eq(characterTable.accessLevel, 'school'),
          arrayOverlaps(userTable.schoolIds, user.schoolIds),
        )
      : undefined;

  const characters = await baseCharacterQuery().where(
    and(
      or(
        eq(characterTable.userId, user.id),
        schoolCondition,
        eq(characterTable.accessLevel, 'global'),
      ),
      eq(characterTable.isDeleted, false),
    ),
  );

  return characters;
}

/**
 * Needs userId because the metadata for shared characters is both tied to the user and character,
 * this is especially important for shared characters (school wide or global).
 */
export async function dbGetCharacterByIdWithShareData({
  characterId,
  user,
}: {
  characterId: string;
  user: Pick<UserModel, 'id'>;
}): Promise<CharacterWithShareDataModel | undefined> {
  const [row] = await baseCharacterWithShareQuery()
    .innerJoin(
      sharedCharacterConversation,
      and(
        eq(sharedCharacterConversation.characterId, characterTable.id),
        eq(sharedCharacterConversation.userId, user.id),
      ),
    )
    .where(eq(characterTable.id, characterId));
  return row;
}

export async function dbGetCharacterByIdOptionalShareData({
  characterId,
  user,
}: {
  characterId: string;
  user: Pick<UserModel, 'id'>;
}): Promise<CharacterOptionalShareDataModel | undefined> {
  const [row] = await baseCharacterWithShareQuery()
    .leftJoin(
      sharedCharacterConversation,
      and(
        eq(sharedCharacterConversation.characterId, characterTable.id),
        eq(sharedCharacterConversation.userId, user.id),
      ),
    )
    .where(eq(characterTable.id, characterId));
  return row;
}

/**
 * The returned entity has no Shared Data Attached! These are found in the SharedCharacterConversation Table
 */
export async function dbGetCharacterById({ characterId }: { characterId: string }) {
  const [row] = await baseCharacterQuery().where(eq(characterTable.id, characterId));
  return row;
}

export async function dbGetCopyTemplateCharacter({
  templateId,
  characterId,
  user,
}: {
  templateId: string;
  characterId: string;
  user: Pick<UserModel, 'id' | 'schoolIds'>;
}): Promise<Omit<CharacterSelectModel, 'modelId'>> {
  const character = await dbGetCharacterByIdWithShareData({ characterId: templateId, user });
  if (character?.name === undefined) {
    throw new Error('Invalid State Template Character must have a name');
  }
  return {
    ...character,
    id: characterId,
    accessLevel: 'private',
    userId: user.id,
  };
}

export async function dbCreateCharacter(
  character: Omit<CharacterInsertModel, 'modelId'> & Partial<Pick<CharacterInsertModel, 'modelId'>>,
) {
  let modelId = character.modelId;
  if (!modelId) {
    modelId = (await dbGetModelByName(DEFAULT_CHAT_MODEL))?.id;
    if (!modelId) {
      throw new Error('No default model found');
    }
  }

  const created = await db
    .insert(characterTable)
    .values({ ...character, modelId })
    .onConflictDoUpdate({ target: characterTable.id, set: { ...character } })
    .returning();
  return created;
}

export async function dbGetGlobalCharacters({
  user,
}: {
  user: Pick<UserModel, 'id' | 'federalStateId'>;
}): Promise<CharacterOptionalShareDataModel[]> {
  const federalStateId = user.federalStateId;

  const characters = await baseCharacterWithShareQuery()
    .leftJoin(
      sharedCharacterConversation,
      and(
        eq(sharedCharacterConversation.characterId, characterTable.id),
        eq(sharedCharacterConversation.userId, user.id),
      ),
    )
    .leftJoin(
      characterTemplateMappingTable,
      eq(characterTemplateMappingTable.characterId, characterTable.id),
    )
    .where(
      and(
        eq(characterTable.accessLevel, 'global'),
        federalStateId
          ? eq(characterTemplateMappingTable.federalStateId, federalStateId)
          : undefined,
        or(
          eq(sharedCharacterConversation.userId, user.id),
          isNull(sharedCharacterConversation.userId),
        ),
      ),
    )
    .orderBy(desc(characterTable.createdAt));

  return characters;
}

/**
 * Retrieves all characters shared at the school level that are accessible to a user.
 *
 * This includes characters from other users who share at least one school with the requesting user.
 * This includes usage data from the SharedCharacterConversation table.
 *
 * @param params.userId - The unique identifier of the user requesting the characters
 * @returns A promise that resolves to an array of character models with associated conversation metadata
 *
 */
export async function dbGetCharactersByAssociatedSchools({
  user,
}: {
  user: Pick<UserModel, 'id' | 'schoolIds'>;
}): Promise<CharacterOptionalShareDataModel[]> {
  const schoolIds = user.schoolIds ?? [];
  if (schoolIds.length === 0) {
    return [];
  }

  const characters = await baseCharacterWithShareQuery()
    .leftJoin(
      sharedCharacterConversation,
      and(
        eq(sharedCharacterConversation.characterId, characterTable.id),
        eq(sharedCharacterConversation.userId, user.id),
      ),
    )
    .where(
      and(
        arrayOverlaps(userTable.schoolIds, schoolIds),
        eq(characterTable.accessLevel, 'school'),
        or(
          eq(sharedCharacterConversation.userId, user.id),
          isNull(sharedCharacterConversation.userId),
        ),
      ),
    )
    .orderBy(desc(characterTable.createdAt));

  return characters;
}

export async function dbGetCharactersByUser({
  user,
}: {
  user: Pick<UserModel, 'id'>;
}): Promise<CharacterOptionalShareDataModel[]> {
  const characters = await baseCharacterWithShareQuery()
    .leftJoin(
      sharedCharacterConversation,
      eq(sharedCharacterConversation.characterId, characterTable.id),
    )
    .where(and(eq(characterTable.userId, user.id), eq(characterTable.accessLevel, 'private')))
    .orderBy(desc(characterTable.createdAt));

  return characters;
}

export async function dbGetAllCharactersByUser({
  user,
}: {
  user: Pick<UserModel, 'id'>;
}): Promise<CharacterOptionalShareDataModel[]> {
  const characters = await baseCharacterWithShareQuery()
    .leftJoin(
      sharedCharacterConversation,
      and(
        eq(sharedCharacterConversation.characterId, characterTable.id),
        eq(sharedCharacterConversation.userId, user.id),
      ),
    )
    .where(eq(characterTable.userId, user.id))
    .orderBy(desc(characterTable.createdAt));

  return characters;
}

export async function dbGetAllAccessibleCharacters({
  user,
}: {
  user: Pick<UserModel, 'id' | 'schoolIds' | 'federalStateId'>;
}): Promise<CharacterOptionalShareDataModel[]> {
  const federalStateId = user.federalStateId;

  return baseCharacterWithShareQuery()
    .leftJoin(
      sharedCharacterConversation,
      and(
        eq(sharedCharacterConversation.characterId, characterTable.id),
        eq(sharedCharacterConversation.userId, user.id),
      ),
    )
    .leftJoin(
      characterTemplateMappingTable,
      eq(characterTemplateMappingTable.characterId, characterTable.id),
    )
    .where(
      or(
        and(eq(characterTable.userId, user.id), eq(characterTable.accessLevel, 'private')),
        user.schoolIds && user.schoolIds.length > 0
          ? and(
              eq(characterTable.accessLevel, 'school'),
              arrayOverlaps(userTable.schoolIds, user.schoolIds),
            )
          : undefined,
        and(
          eq(characterTable.accessLevel, 'global'),
          eq(characterTemplateMappingTable.federalStateId, federalStateId),
        ),
      ),
    )
    .orderBy(desc(characterTable.createdAt));
}

export async function dbGetCharacterByIdAndUser({
  characterId,
  user,
}: {
  characterId: string;
  user: Pick<UserModel, 'id'>;
}): Promise<CharacterWithShareDataModel | undefined> {
  const [row] = await baseCharacterWithShareQuery()
    .innerJoin(
      sharedCharacterConversation,
      and(
        eq(sharedCharacterConversation.characterId, characterTable.id),
        eq(sharedCharacterConversation.userId, user.id),
      ),
    )
    .where(
      and(eq(characterTable.id, characterId), eq(sharedCharacterConversation.userId, user.id)),
    );
  //.where(and(eq(characterTable.id, characterId), eq(characterTable.userId, userId)));
  return row;
}

export async function dbDeleteCharacterByIdAndUser({
  characterId,
  user,
}: {
  characterId: string;
  user: Pick<UserModel, 'id'>;
}) {
  const [character] = await db
    .select()
    .from(characterTable)
    .where(and(eq(characterTable.id, characterId), eq(characterTable.userId, user.id)));

  if (character === undefined) {
    throw new Error('Character does not exist');
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
    await tx.delete(fileTable).where(
      inArray(
        fileTable.id,
        relatedFiles.map((f) => f.id),
      ),
    );
    const deletedCharacter = (
      await tx
        .delete(characterTable)
        .where(and(eq(characterTable.id, characterId), eq(characterTable.userId, user.id)))
        .returning()
    )[0];

    if (deletedCharacter === undefined) {
      throw new Error('Could not delete character');
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
}): Promise<CharacterWithShareDataModel | undefined> {
  const [row] = await baseCharacterWithShareQuery()
    .innerJoin(
      sharedCharacterConversation,
      eq(sharedCharacterConversation.characterId, characterTable.id),
    )
    .where(and(eq(characterTable.id, id), eq(sharedCharacterConversation.inviteCode, inviteCode)));

  return row;
}

export async function dbUpdateTokenUsageByCharacterChatId(
  value: SharedCharacterChatUsageTrackingInsertModel,
) {
  const insertedUsage = (
    await db.insert(sharedCharacterChatUsageTrackingTable).values(value).returning()
  )[0];
  if (insertedUsage === undefined) {
    throw new Error('Could not track the token usage');
  }

  return insertedUsage;
}

export async function dbGetCharacterByNameAndUser({
  name,
  user,
}: {
  name: string;
  user: Pick<UserModel, 'id'>;
}): Promise<CharacterSelectModel | undefined> {
  const [character] = await baseCharacterQuery().where(
    and(eq(characterTable.name, name), eq(characterTable.userId, user.id)),
  );
  return character;
}

export async function dbGetGlobalCharacterByName({
  name,
}: {
  name: string;
}): Promise<CharacterSelectModel | undefined> {
  const [character] = await baseCharacterQuery().where(
    and(eq(characterTable.name, name), eq(characterTable.accessLevel, 'global')),
  );
  return character;
}

/**
 * Returns all shared character conversations for a given character and user.
 */
export async function dbGetSharedCharacterConversations({
  characterId,
  user,
}: {
  characterId: string;
  user: Pick<UserModel, 'id'>;
}) {
  return await db
    .select()
    .from(sharedCharacterConversation)
    .where(
      and(
        eq(sharedCharacterConversation.characterId, characterId),
        eq(sharedCharacterConversation.userId, user.id),
      ),
    );
}
