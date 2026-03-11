import {
  dbGetAllProjectsByOrganizationId,
  dbGetProjectById,
  dbCreateProject,
  dbGetOrganizationById,
} from '@telli/api-database';
import { logInfo } from '@shared/logging';

export async function getProjects(organizationId: string) {
  const organization = await dbGetOrganizationById(organizationId);
  if (!organization) throw new Error('Organization not found');
  return dbGetAllProjectsByOrganizationId(organizationId);
}

export async function getSingleProject(organizationId: string, projectId: string) {
  const project = await dbGetProjectById(organizationId, projectId);
  if (!project) throw new Error('Project not found');
  return project;
}

export async function createProject(
  organizationId: string,
  projectData: { id: string; name: string },
) {
  const project = await dbCreateProject({
    id: projectData.id,
    name: projectData.name,
    organizationId,
  });

  logInfo('Project was created successfully', { organizationId, projectData });

  if (!project) throw new Error('Failed to create project');
  return project;
}
