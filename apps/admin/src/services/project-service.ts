const apiRoutes = {
  GET_ALL: '/v1/admin/organizations/{organizationId}/projects',
  GET_SINGLE: '/v1/admin/organizations/{organizationId}/projects/{projectId}',
};

import { env } from '../consts/env';
import { Project } from '../types/project';

export async function fetchProjects(organizationId: string): Promise<Project[]> {
  const response = await fetch(
    env.BASE_URL_TELLI_API + apiRoutes.GET_ALL.replace('{organizationId}', organizationId),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.API_KEY_TELLI_API}`,
      },
    },
  );
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
    env.BASE_URL_TELLI_API +
      apiRoutes.GET_SINGLE.replace('{organizationId}', organizationId).replace(
        '{projectId}',
        projectId,
      ),
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
