import { eq } from 'drizzle-orm';
import { db, llmModelTable, OrganizationInsertModel, organizationTable, projectTable } from '..';
import { isNotNull } from '@telli/api-utils';

export async function dbGetAllOrganizations() {
  return await db
    .select()
    .from(organizationTable)
    .orderBy(organizationTable.name, organizationTable.createdAt);
}

export async function dbGetOrganizationById(organizationId: string) {
  const [organization] = await db
    .select()
    .from(organizationTable)
    .where(eq(organizationTable.id, organizationId));
  return organization;
}

export async function dbGetOrganizationAndProjectsByOrganizationId({
  organizationId,
}: {
  organizationId: string;
}) {
  const organizationResult = await db
    .select()
    .from(organizationTable)
    .where(eq(organizationTable.id, organizationId));

  const organization = organizationResult[0];
  if (!organization) return undefined;

  const projects = await db
    .select()
    .from(projectTable)
    .where(eq(projectTable.organizationId, organizationId));

  const models = await db
    .select()
    .from(llmModelTable)
    .where(eq(llmModelTable.organizationId, organizationId));

  return {
    organization,
    projects: projects.filter(isNotNull),
    models: models.filter(isNotNull),
  };
}

export async function dbGetOrganizationByProjectId({ projectId }: { projectId: string }) {
  const [row] = await db
    .select()
    .from(projectTable)
    .innerJoin(organizationTable, eq(projectTable.organizationId, organizationTable.id))
    .where(eq(projectTable.id, projectId));

  if (row === undefined) return undefined;

  return row.organization;
}

export async function dbCreateOrganization(organization: OrganizationInsertModel) {
  const result = await db.insert(organizationTable).values(organization).returning();
  return result[0];
}

export async function dbDeleteOrganizationById(organizationId: string) {
  await db.delete(organizationTable).where(eq(organizationTable.id, organizationId));
}
