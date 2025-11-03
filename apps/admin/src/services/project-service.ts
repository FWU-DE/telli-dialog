import { env } from '../consts/env';
import { Project } from '../types/project';
import { fetchFromApi } from './fetch';

const apiRoutes = {
  GET_ALL: (organizationId: string) => `/v1/admin/organizations/${organizationId}/projects`,
  GET_SINGLE: (organizationId: string, projectId: string) =>
    `/v1/admin/organizations/${organizationId}/projects/${projectId}`,
};

export async function fetchProjects(organizationId: string): Promise<Project[]> {
  const response = await fetchFromApi(env.BASE_URL_TELLI_API + apiRoutes.GET_ALL(organizationId));

  const data = await response.json();
  return data as Project[];
}

export async function fetchSingleProject(
  organizationId: string,
  projectId: string,
): Promise<Project> {
  const response = await fetchFromApi(
    env.BASE_URL_TELLI_API + apiRoutes.GET_SINGLE(organizationId, projectId),
  );

  const data = await response.json();
  return data as Project;
}
