import { env } from '../consts/env';
import { Project } from '../types/project';

const apiRoutes = {
  GET_ALL: (organizationId: string) => `/v1/admin/organizations/${organizationId}/projects`,
  GET_SINGLE: (organizationId: string, projectId: string) =>
    `/v1/admin/organizations/${organizationId}/projects/${projectId}`,
};

export async function fetchProjects(organizationId: string): Promise<Project[]> {
  const response = await fetch(env.BASE_URL_TELLI_API + apiRoutes.GET_ALL(organizationId), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.API_KEY_TELLI_API}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.statusText}`);
  }

  const data = await response.json();

  return data as Project[];
}

export async function fetchSingleProject(
  organizationId: string,
  projectId: string,
): Promise<Project> {
  const response = await fetch(
    env.BASE_URL_TELLI_API + apiRoutes.GET_SINGLE(organizationId, projectId),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.API_KEY_TELLI_API}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch project: ${response.statusText}`);
  }

  const data = await response.json();
  return data as Project;
}
