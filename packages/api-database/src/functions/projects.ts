import { and, eq } from "drizzle-orm";
import {
  ApiKeyModel,
  apiKeyTable,
  db,
  ProjectModel,
  projectTable,
  ProjectInsertModel,
} from "..";

export async function dbGetAllProjects() {
  return await db.select().from(projectTable).orderBy(projectTable.createdAt);
}

export async function dbGetAllProjectsByOrganizationId(organizationId: string) {
  return await db
    .select()
    .from(projectTable)
    .where(eq(projectTable.organizationId, organizationId))
    .orderBy(projectTable.name);
}

export async function dbGetProjectById(
  organizationId: string,
  projectId: string,
) {
  return (
    await db
      .select()
      .from(projectTable)
      .where(
        and(
          eq(projectTable.id, projectId),
          eq(projectTable.organizationId, organizationId),
        ),
      )
  )[0];
}

export async function dbGetProjectsWithApiKeys({
  organizationId,
}: {
  organizationId: string;
}) {
  const rows = await db
    .select()
    .from(projectTable)
    .innerJoin(apiKeyTable, eq(apiKeyTable.projectId, projectTable.id))
    .orderBy(projectTable.createdAt)
    .where(eq(projectTable.organizationId, organizationId));

  return organizeProjectsWithApiKeys(rows);
}

function organizeProjectsWithApiKeys(
  rows: {
    project: ProjectModel;
    api_key: ApiKeyModel;
  }[],
) {
  const projectMap = new Map<
    string,
    {
      project: ProjectModel;
      apiKeys: ApiKeyModel[];
    }
  >();

  for (const row of rows) {
    const projectId = row.project.id;

    if (!projectMap.has(projectId)) {
      projectMap.set(projectId, {
        project: row.project,
        apiKeys: [],
      });
    }

    projectMap.get(projectId)?.apiKeys.push(row.api_key);
  }

  return Array.from(projectMap.values());
}

export async function dbCreateProject(project: ProjectInsertModel) {
  const projectCreated = await db
    .insert(projectTable)
    .values({ ...project })
    .returning();
  return projectCreated[0];
}

export async function dbUpdateProject(
  project: Omit<ProjectModel, "createdAt">,
) {
  const projectUpdated = await db
    .update(projectTable)
    .set({ name: project.name })
    .where(
      and(
        eq(projectTable.organizationId, project.organizationId),
        eq(projectTable.id, project.id),
      ),
    )
    .returning();
  return projectUpdated[0];
}
