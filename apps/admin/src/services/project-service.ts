import { env } from '../consts/env';
import { Project } from '../types/project';
import { fetchFromApi } from './fetch';
import { logInfo } from '@shared/logging';

const apiRoutes = {
  GET_ALL: (organizationId: string) => `/v1/admin/organizations/${organizationId}/projects`,
  GET_SINGLE: (organizationId: string, projectId: string) =>
    `/v1/admin/organizations/${organizationId}/projects/${projectId}`,
  CREATE: (organizationId: string) => `/v1/admin/organizations/${organizationId}/projects`,
};

export async function fetchProjects(organizationId: string): Promise<Project[]> {
  const response = await fetchFromApi(env.telliApiBaseUrl + apiRoutes.GET_ALL(organizationId));

  const data = await response.json();
  return data as Project[];
}

export async function fetchSingleProject(
  organizationId: string,
  projectId: string,
): Promise<Project> {
  const response = await fetchFromApi(
    env.telliApiBaseUrl + apiRoutes.GET_SINGLE(organizationId, projectId),
  );

  const data = await response.json();
  return data as Project;
}

export async function createProject(
  organizationId: string,
  projectData: Pick<Project, 'id' | 'name'>,
): Promise<Project> {
  const response = await fetchFromApi(env.telliApiBaseUrl + apiRoutes.CREATE(organizationId), {
    method: 'POST',
    body: JSON.stringify(projectData),
  });

  logInfo('Project was created successfully', { organizationId, projectData });

  const data = await response.json();
  return data as Project;
}
