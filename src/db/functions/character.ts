import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { db } from '..';
import {
  CharacterModel,
  characterTable,
  conversationMessageTable,
  conversationTable,
} from '../schema';

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

export async function dbGetCharacterById({ id }: { id: string }) {
  const [character] = await db.select().from(characterTable).where(eq(characterTable.id, id));
  return character;
}
