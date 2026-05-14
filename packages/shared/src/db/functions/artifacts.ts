import { eq, desc } from 'drizzle-orm';
import { db } from '..';
import { artifactTable, artifactVersionTable } from '../schema';
import type { ArtifactInsertModel, ArtifactVersionSelectModel } from '../schema';

export async function dbInsertArtifact(data: ArtifactInsertModel) {
  const [artifact] = await db.insert(artifactTable).values(data).returning();
  if (artifact === undefined) {
    throw new Error('Failed to insert artifact');
  }
  return artifact;
}

export async function dbInsertArtifactVersion(data: {
  artifactId: string;
  messageId: string;
  content: string;
  versionNumber: number;
}) {
  const [version] = await db.insert(artifactVersionTable).values(data).returning();
  if (version === undefined) {
    throw new Error('Failed to insert artifact version');
  }
  return version;
}

export async function dbGetLatestArtifactVersionByConversationId(
  conversationId: string,
): Promise<(ArtifactVersionSelectModel & { artifactTitle: string }) | undefined> {
  const rows = await db
    .select({
      id: artifactVersionTable.id,
      artifactId: artifactVersionTable.artifactId,
      messageId: artifactVersionTable.messageId,
      content: artifactVersionTable.content,
      versionNumber: artifactVersionTable.versionNumber,
      createdAt: artifactVersionTable.createdAt,
      artifactTitle: artifactTable.title,
    })
    .from(artifactVersionTable)
    .innerJoin(artifactTable, eq(artifactVersionTable.artifactId, artifactTable.id))
    .where(eq(artifactTable.conversationId, conversationId))
    .orderBy(desc(artifactVersionTable.versionNumber))
    .limit(1);

  return rows[0];
}

export async function dbGetArtifactByConversationId(conversationId: string) {
  const rows = await db
    .select()
    .from(artifactTable)
    .where(eq(artifactTable.conversationId, conversationId))
    .limit(1);

  return rows[0];
}

export async function dbGetLatestVersionNumberByArtifactId(artifactId: string): Promise<number> {
  const rows = await db
    .select({ versionNumber: artifactVersionTable.versionNumber })
    .from(artifactVersionTable)
    .where(eq(artifactVersionTable.artifactId, artifactId))
    .orderBy(desc(artifactVersionTable.versionNumber))
    .limit(1);

  return rows[0]?.versionNumber ?? 0;
}
