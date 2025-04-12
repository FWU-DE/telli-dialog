import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { db } from '..';
import {
  CharacterInsertModel,
  CharacterModel,
  characterTable,
  conversationMessageTable,
  conversationTable,
  SharedCharacterChatUsageTrackingInsertModel,
  sharedCharacterChatUsageTrackingTable,
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

export async function dbGetCharactersById({characterId}: {characterId:string}) {
  return (await db.select().from(characterTable).where(eq(characterTable.id, characterId)))[0];
}

export async function dbGetCopyTemplateCharacter({
  templateId,
  characterId,
  userId,
}: {
  templateId: string,
  characterId: string;
  userId: string;
}): Promise<Omit<CharacterInsertModel, 'modelId'>> {
  const character = await dbGetCharactersById({characterId: templateId});
  if (character?.name === undefined) {
    throw new Error('Invalid State Template Character must have a name');
  }
  return {
    id: characterId,
    name: character.name,
    description: character?.description,
    learningContext: character?.learningContext,
    competence: character?.competence,
    schoolType: character?.schoolType,
    gradeLevel: character?.gradeLevel,
    subject: character?.subject,
    specifications: character?.specifications,
    restrictions: character?.restrictions,
    pictureId: character?.pictureId,
    accessLevel: 'private',
    userId,
  };
}

export async function dbCreateCharacter(character: Omit<CharacterInsertModel, 'modelId'>) {
  const defaultModelId = await dbGetModelByName(DEFAULT_CHAT_MODEL);
  if (defaultModelId === undefined) return;
  const created = await db
    .insert(characterTable)
    .values({ ...character, modelId: defaultModelId.id })
    .onConflictDoUpdate({ target: characterTable.id, set: { ...character } })
    .returning();
  return created;
}

export async function dbGetGlobalCharacters(): Promise<CharacterModel[]> {
  const characters = await db
    .select()
    .from(characterTable)
    .where(eq(characterTable.accessLevel, 'global'))
    .orderBy(desc(characterTable.createdAt));

  return characters;
}

export async function dbGetCharactersBySchoolId({
  schoolId,
}: {
  schoolId: string;
}): Promise<CharacterModel[]> {
  const characters = await db
    .select()
    .from(characterTable)
    .where(and(eq(characterTable.schoolId, schoolId), eq(characterTable.accessLevel, 'school')))
    .orderBy(desc(characterTable.createdAt));

  return characters;
}

export async function dbGetCharactersByUserId({
  userId,
}: {
  userId: string;
}): Promise<CharacterModel[]> {
  const characters = await db
    .select()
    .from(characterTable)
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
}) {
  const [row] = await db
    .select()
    .from(characterTable)
    .where(and(eq(characterTable.id, characterId), eq(characterTable.userId, userId)));
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
}) {
  return (
    await db
      .select()
      .from(characterTable)
      .where(and(eq(characterTable.id, id), eq(characterTable.inviteCode, inviteCode)))
  )[0];
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
