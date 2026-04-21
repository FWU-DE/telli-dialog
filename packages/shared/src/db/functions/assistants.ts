import { db } from '..';
import { and, desc, eq, getTableColumns, inArray, or } from 'drizzle-orm';
import {
  conversationMessageTable,
  conversationTable,
  AssistantFileMapping,
  type AssistantInsertModel,
  type AssistantSelectModel,
  assistantTable,
  assistantTemplateMappingTable,
  fileTable,
} from '../schema';
import { NotFoundError } from '@shared/error';

export async function dbGetAssistantsByUserId({
  userId,
}: {
  userId: string;
}): Promise<AssistantSelectModel[]> {
  return db.select().from(assistantTable).where(eq(assistantTable.userId, userId));
}

export async function dbGetAssistantById({
  assistantId,
}: {
  assistantId: string;
}): Promise<AssistantSelectModel> {
  const [assistant] = await db
    .select()
    .from(assistantTable)
    .where(and(eq(assistantTable.id, assistantId)));

  if (!assistant) throw new NotFoundError('Assistant not found');

  return assistant;
}

export async function dbGetGlobalGpts({
  federalStateId,
}: {
  federalStateId?: string;
}): Promise<AssistantSelectModel[]> {
  if (federalStateId) {
    return db
      .select({ ...getTableColumns(assistantTable) })
      .from(assistantTable)
      .innerJoin(
        assistantTemplateMappingTable,
        eq(assistantTemplateMappingTable.assistantId, assistantTable.id),
      )
      .where(
        and(
          eq(assistantTable.accessLevel, 'global'),
          eq(assistantTemplateMappingTable.federalStateId, federalStateId),
        ),
      )
      .orderBy(desc(assistantTable.createdAt));
  } else {
    return db
      .select()
      .from(assistantTable)
      .where(eq(assistantTable.accessLevel, 'global'))
      .orderBy(desc(assistantTable.createdAt));
  }
}

export async function dbGetGlobalAssistantByName({
  name,
}: {
  name: string;
}): Promise<AssistantSelectModel | undefined> {
  const [assistant] = await db
    .select()
    .from(assistantTable)
    .where(and(eq(assistantTable.name, name), eq(assistantTable.accessLevel, 'global')));
  return assistant;
}

export async function dbGetGptsBySchoolId({
  schoolId,
}: {
  schoolId: string;
}): Promise<AssistantSelectModel[]> {
  return db
    .select()
    .from(assistantTable)
    .where(and(eq(assistantTable.schoolId, schoolId), eq(assistantTable.accessLevel, 'school')))
    .orderBy(desc(assistantTable.createdAt));
}

export async function dbGetGptsByUserId({
  userId,
}: {
  userId: string;
}): Promise<AssistantSelectModel[]> {
  return db
    .select()
    .from(assistantTable)
    .where(and(eq(assistantTable.userId, userId), eq(assistantTable.accessLevel, 'private')))
    .orderBy(desc(assistantTable.createdAt));
}

export async function dbGetAssistantByIdOrSchoolId({
  assistantId: characterId,
  userId,
  schoolId,
}: {
  assistantId: string;
  userId: string;
  schoolId: string | null;
}) {
  const [character] = await db
    .select()
    .from(assistantTable)
    .where(
      or(
        and(
          eq(assistantTable.id, characterId),
          eq(assistantTable.userId, userId),
          eq(assistantTable.accessLevel, 'private'),
        ),
        schoolId !== null
          ? and(
              eq(assistantTable.id, characterId),
              eq(assistantTable.schoolId, schoolId),
              eq(assistantTable.accessLevel, 'school'),
            )
          : undefined,
        eq(assistantTable.accessLevel, 'global'),
      ),
    );

  return character;
}

export async function dbUpsertAssistant({
  assistant,
}: {
  assistant: AssistantInsertModel;
}): Promise<AssistantSelectModel | undefined> {
  const [insertedAssistant] = await db
    .insert(assistantTable)
    .values(assistant)
    .onConflictDoUpdate({
      target: assistantTable.id,
      set: { ...assistant },
    })
    .returning();

  return insertedAssistant;
}

export async function dbUpdateAssistant({
  assistantId,
  assistant,
}: {
  assistantId: string;
  assistant: Partial<AssistantInsertModel>;
}): Promise<AssistantSelectModel | undefined> {
  const [updatedAssistant] = await db
    .update(assistantTable)
    .set(assistant)
    .where(eq(assistantTable.id, assistantId))
    .returning();

  return updatedAssistant;
}

export async function dbDeleteAssistant({ assistantId }: { assistantId: string }) {
  await db.transaction(async (tx) => {
    const assistantConversations = await tx
      .select()
      .from(conversationTable)
      .where(eq(conversationTable.assistantId, assistantId));

    if (assistantConversations.length > 0) {
      await Promise.all(
        assistantConversations.map(async (conversation) => {
          await tx
            .delete(conversationMessageTable)
            .where(eq(conversationMessageTable.conversationId, conversation.id));
        }),
      );
    }

    await tx.delete(conversationTable).where(eq(conversationTable.assistantId, assistantId));
    await tx.delete(assistantTable).where(eq(assistantTable.id, assistantId));
  });
}

export async function dbDeleteAssistantByIdAndUserId({
  gptId: gptId,
  userId,
}: {
  gptId: string;
  userId: string;
}) {
  const [assistant] = await db
    .select()
    .from(assistantTable)
    .where(and(eq(assistantTable.id, gptId), eq(assistantTable.userId, userId)));

  if (assistant === undefined) {
    throw new Error('Assistant does not exist');
  }

  const deletedAssistant = await db.transaction(async (tx) => {
    const relatedFiles = await tx
      .select({ id: AssistantFileMapping.fileId })
      .from(AssistantFileMapping)
      .where(eq(AssistantFileMapping.assistantId, assistant.id));

    const conversations = await tx
      .select({ id: conversationTable.id })
      .from(conversationTable)
      .where(eq(conversationTable.assistantId, assistant.id));

    if (conversations.length > 0) {
      await tx.delete(conversationMessageTable).where(
        inArray(
          conversationMessageTable.conversationId,
          conversations.map((c) => c.id),
        ),
      );
    }
    await tx.delete(conversationTable).where(eq(conversationTable.assistantId, assistant.id));
    await tx.delete(AssistantFileMapping).where(eq(AssistantFileMapping.assistantId, assistant.id));
    await tx.delete(fileTable).where(
      inArray(
        fileTable.id,
        relatedFiles.map((f) => f.id),
      ),
    );
    const deletedAssistant = (
      await tx
        .delete(assistantTable)
        .where(and(eq(assistantTable.id, gptId), eq(assistantTable.userId, userId)))
        .returning()
    )[0];

    if (deletedAssistant === undefined) {
      throw new Error('Could not delete assistant');
    }
    return deletedAssistant;
  });

  return deletedAssistant;
}

/**
 * adds a new file mapping entry
 */
export async function dbInsertAssistantFileMapping({
  fileId,
  assistantId,
}: {
  fileId: string;
  assistantId: string;
}) {
  const [insertedFileMapping] = await db
    .insert(AssistantFileMapping)
    .values({ fileId, assistantId })
    .returning();

  return insertedFileMapping;
}
