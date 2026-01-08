import { db } from '..';
import { and, desc, eq, getTableColumns, inArray, or } from 'drizzle-orm';
import {
  conversationMessageTable,
  conversationTable,
  CustomGptFileMapping,
  type CustomGptInsertModel,
  type CustomGptSelectModel,
  customGptTable,
  customGptTemplateMappingTable,
  fileTable,
  TextChunkTable,
} from '../schema';
import { NotFoundError } from '@shared/error';

export async function dbGetCustomGptsByUserId({
  userId,
}: {
  userId: string;
}): Promise<CustomGptSelectModel[]> {
  return db.select().from(customGptTable).where(eq(customGptTable.userId, userId));
}

export async function dbGetCustomGptById({
  customGptId,
}: {
  customGptId: string;
}): Promise<CustomGptSelectModel> {
  const [customGpt] = await db
    .select()
    .from(customGptTable)
    .where(and(eq(customGptTable.id, customGptId)));

  if (!customGpt) throw new NotFoundError('Custom GPT not found');

  return customGpt;
}

export async function dbGetGlobalGpts({
  federalStateId,
}: {
  federalStateId?: string;
}): Promise<CustomGptSelectModel[]> {
  if (federalStateId) {
    return db
      .select({ ...getTableColumns(customGptTable) })
      .from(customGptTable)
      .innerJoin(
        customGptTemplateMappingTable,
        eq(customGptTemplateMappingTable.customGptId, customGptTable.id),
      )
      .where(
        and(
          eq(customGptTable.accessLevel, 'global'),
          eq(customGptTemplateMappingTable.federalStateId, federalStateId),
        ),
      )
      .orderBy(desc(customGptTable.createdAt));
  } else {
    return db
      .select()
      .from(customGptTable)
      .where(eq(customGptTable.accessLevel, 'global'))
      .orderBy(desc(customGptTable.createdAt));
  }
}

export async function dbGetGlobalCustomGptByName({
  name,
}: {
  name: string;
}): Promise<CustomGptSelectModel | undefined> {
  const [customGpt] = await db
    .select()
    .from(customGptTable)
    .where(and(eq(customGptTable.name, name), eq(customGptTable.accessLevel, 'global')));
  return customGpt;
}

export async function dbGetGptsBySchoolId({
  schoolId,
}: {
  schoolId: string;
}): Promise<CustomGptSelectModel[]> {
  return db
    .select()
    .from(customGptTable)
    .where(and(eq(customGptTable.schoolId, schoolId), eq(customGptTable.accessLevel, 'school')))
    .orderBy(desc(customGptTable.createdAt));
}

export async function dbGetGptsByUserId({
  userId,
}: {
  userId: string;
}): Promise<CustomGptSelectModel[]> {
  return db
    .select()
    .from(customGptTable)
    .where(and(eq(customGptTable.userId, userId), eq(customGptTable.accessLevel, 'private')))
    .orderBy(desc(customGptTable.createdAt));
}

export async function dbGetCustomGptByIdOrSchoolId({
  customGptId: characterId,
  userId,
  schoolId,
}: {
  customGptId: string;
  userId: string;
  schoolId: string | null;
}) {
  const [character] = await db
    .select()
    .from(customGptTable)
    .where(
      or(
        and(
          eq(customGptTable.id, characterId),
          eq(customGptTable.userId, userId),
          eq(customGptTable.accessLevel, 'private'),
        ),
        schoolId !== null
          ? and(
              eq(customGptTable.id, characterId),
              eq(customGptTable.schoolId, schoolId),
              eq(customGptTable.accessLevel, 'school'),
            )
          : undefined,
        eq(customGptTable.accessLevel, 'global'),
      ),
    );

  return character;
}

export async function dbUpsertCustomGpt({
  customGpt,
}: {
  customGpt: CustomGptInsertModel;
}): Promise<CustomGptSelectModel | undefined> {
  const [insertedCustomGpt] = await db
    .insert(customGptTable)
    .values(customGpt)
    .onConflictDoUpdate({
      target: customGptTable.id,
      set: { ...customGpt },
    })
    .returning();

  return insertedCustomGpt;
}

export async function dbUpdateCustomGpt({
  customGptId,
  customGpt,
}: {
  customGptId: string;
  customGpt: Partial<CustomGptInsertModel>;
}): Promise<CustomGptSelectModel | undefined> {
  const [updatedCustomGpt] = await db
    .update(customGptTable)
    .set(customGpt)
    .where(eq(customGptTable.id, customGptId))
    .returning();

  return updatedCustomGpt;
}

export async function dbDeleteCustomGpt({ customGptId }: { customGptId: string }) {
  await db.transaction(async (tx) => {
    const customGptConversations = await tx
      .select()
      .from(conversationTable)
      .where(eq(conversationTable.customGptId, customGptId));

    if (customGptConversations.length > 0) {
      await Promise.all(
        customGptConversations.map(async (conversation) => {
          await tx
            .delete(conversationMessageTable)
            .where(eq(conversationMessageTable.conversationId, conversation.id));
        }),
      );
    }

    await tx.delete(conversationTable).where(eq(conversationTable.customGptId, customGptId));
    await tx.delete(customGptTable).where(eq(customGptTable.id, customGptId));
  });
}

export async function dbDeleteCustomGptByIdAndUserId({
  gptId: gptId,
  userId,
}: {
  gptId: string;
  userId: string;
}) {
  const [customGpt] = await db
    .select()
    .from(customGptTable)
    .where(and(eq(customGptTable.id, gptId), eq(customGptTable.userId, userId)));

  if (customGpt === undefined) {
    throw Error('Custom GPT does not exist');
  }

  const deletedGpt = await db.transaction(async (tx) => {
    const relatedFiles = await tx
      .select({ id: CustomGptFileMapping.fileId })
      .from(CustomGptFileMapping)
      .where(eq(CustomGptFileMapping.customGptId, customGpt.id));

    const conversations = await tx
      .select({ id: conversationTable.id })
      .from(conversationTable)
      .where(eq(conversationTable.customGptId, customGpt.id));

    if (conversations.length > 0) {
      await tx.delete(conversationMessageTable).where(
        inArray(
          conversationMessageTable.conversationId,
          conversations.map((c) => c.id),
        ),
      );
    }
    await tx.delete(conversationTable).where(eq(conversationTable.customGptId, customGpt.id));
    await tx.delete(CustomGptFileMapping).where(eq(CustomGptFileMapping.customGptId, customGpt.id));
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
    const deletedGpt = (
      await tx
        .delete(customGptTable)
        .where(and(eq(customGptTable.id, gptId), eq(customGptTable.userId, userId)))
        .returning()
    )[0];

    if (deletedGpt === undefined) {
      throw Error('Could not delete custom GPT');
    }
    return deletedGpt;
  });

  return deletedGpt;
}

/**
 * adds a new file mapping entry
 */
export async function dbInsertCustomGptFileMapping({
  fileId,
  customGptId,
}: {
  fileId: string;
  customGptId: string;
}) {
  const [insertedFileMapping] = await db
    .insert(CustomGptFileMapping)
    .values({ fileId, customGptId })
    .returning();

  return insertedFileMapping;
}
