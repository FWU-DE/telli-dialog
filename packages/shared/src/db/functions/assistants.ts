import { db } from '..';
import { and, arrayOverlaps, desc, eq, getTableColumns, inArray, or, sql } from 'drizzle-orm';
import {
  conversationMessageTable,
  conversationTable,
  AssistantFileMapping,
  type AssistantInsertModel,
  type AssistantSelectModel,
  assistantTable,
  assistantTemplateMappingTable,
  fileTable,
  userTable,
} from '../schema';
import { NotFoundError } from '@shared/error';
import { UserModel } from '@shared/auth/user-model';

function baseAssistantQuery() {
  return db
    .select({
      ...getTableColumns(assistantTable),
      ownerSchoolIds: sql<string[]>`coalesce(${userTable.schoolIds}, '{}'::text[])`,
    })
    .from(assistantTable)
    .leftJoin(userTable, eq(assistantTable.userId, userTable.id));
}

export async function dbGetAssistantsByUserId({
  user,
}: {
  user: Pick<UserModel, 'id'>;
}): Promise<AssistantSelectModel[]> {
  return baseAssistantQuery().where(eq(assistantTable.userId, user.id));
}

export async function dbGetAssistantById({
  assistantId,
}: {
  assistantId: string;
}): Promise<AssistantSelectModel> {
  const [assistant] = await baseAssistantQuery().where(eq(assistantTable.id, assistantId));

  if (!assistant) throw new NotFoundError('Assistant not found');

  return assistant;
}

export async function dbGetGlobalGpts({
  user,
}: {
  user: Pick<UserModel, 'id' | 'schoolIds' | 'federalStateId'>;
}): Promise<AssistantSelectModel[]> {
  const federalStateId = user.federalStateId;

  if (federalStateId) {
    return baseAssistantQuery()
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
    return baseAssistantQuery()
      .where(eq(assistantTable.accessLevel, 'global'))
      .orderBy(desc(assistantTable.createdAt));
  }
}

export async function dbGetGlobalAssistantByName({
  name,
}: {
  name: string;
}): Promise<AssistantSelectModel | undefined> {
  const [assistant] = await baseAssistantQuery().where(
    and(eq(assistantTable.name, name), eq(assistantTable.accessLevel, 'global')),
  );
  return assistant;
}

export async function dbGetGptsByAssociatedSchools({
  user,
}: {
  user: Pick<UserModel, 'schoolIds'>;
}): Promise<AssistantSelectModel[]> {
  const requesterSchoolIds = user.schoolIds ?? [];

  if (requesterSchoolIds.length === 0) {
    return [];
  }

  return baseAssistantQuery()
    .where(
      and(
        eq(assistantTable.accessLevel, 'school'),
        arrayOverlaps(userTable.schoolIds, requesterSchoolIds),
      ),
    )
    .orderBy(desc(assistantTable.createdAt));
}

export async function dbGetGptsByUser({
  user,
}: {
  user: Pick<UserModel, 'id'>;
}): Promise<AssistantSelectModel[]> {
  return baseAssistantQuery()
    .where(and(eq(assistantTable.userId, user.id), eq(assistantTable.accessLevel, 'private')))
    .orderBy(desc(assistantTable.createdAt));
}

export async function dbGetAssistantByIdOrAssociatedSchool({
  assistantId,
  user,
}: {
  assistantId: string;
  user: Pick<UserModel, 'id' | 'schoolIds'>;
}) {
  const requesterSchoolIds = user.schoolIds ?? [];

  const [assistant] = await baseAssistantQuery().where(
    or(
      and(
        eq(assistantTable.id, assistantId),
        eq(assistantTable.userId, user.id),
        eq(assistantTable.accessLevel, 'private'),
      ),
      requesterSchoolIds.length > 0
        ? and(
            eq(assistantTable.id, assistantId),
            eq(assistantTable.accessLevel, 'school'),
            arrayOverlaps(userTable.schoolIds, requesterSchoolIds),
          )
        : undefined,
      eq(assistantTable.accessLevel, 'global'),
    ),
  );

  return assistant;
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

  if (!insertedAssistant) return undefined;
  return dbGetAssistantById({ assistantId: insertedAssistant.id });
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

  if (!updatedAssistant) return undefined;
  return dbGetAssistantById({ assistantId: updatedAssistant.id });
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

export async function dbDeleteAssistantByIdAndUser({
  gptId: gptId,
  user,
}: {
  gptId: string;
  user: Pick<UserModel, 'id'>;
}) {
  const [assistant] = await db
    .select()
    .from(assistantTable)
    .where(and(eq(assistantTable.id, gptId), eq(assistantTable.userId, user.id)));

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
        .where(and(eq(assistantTable.id, gptId), eq(assistantTable.userId, user.id)))
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
