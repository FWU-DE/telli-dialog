'use server';
import {
  fetchProjects,
  fetchSingleProject,
  createProject,
} from '../../../../../services/project-service';
import { fetchApiKeys, createApiKey } from '../../../../../services/api-key-service';
import { Project } from '../../../../../types/project';
import { ApiKey } from '../../../../../types/api-key';

export async function getProjectsAction(organizationId: string) {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  // Todo: error handling
  return fetchProjects(organizationId);
}

export async function getProjectByIdAction(organizationId: string, projectId: string) {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  // Todo: error handling
  return fetchSingleProject(organizationId, projectId);
}

export async function createProjectAction(
  organizationId: string,
  id: string,
  name: string,
): Promise<Project> {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  if (!id.trim()) {
    throw new Error('Projekt-ID ist erforderlich');
  }

  if (!name.trim()) {
    throw new Error('Projektname ist erforderlich');
  }

  try {
    return await createProject(organizationId, { id: id.trim(), name: name.trim() });
  } catch (error) {
    throw new Error('Fehler beim Erstellen des Projekts');
  }
}

export async function getApiKeysAction(organizationId: string, projectId: string): Promise<ApiKey[]> {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  // Todo: error handling
  return fetchApiKeys(organizationId, projectId);
}

export async function createApiKeyAction(
  organizationId: string,
  projectId: string,
  name: string,
  state?: 'active' | 'inactive' | 'deleted',
  limitInCent?: number,
  expiresAt?: Date | null,
): Promise<ApiKey> {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  if (!name.trim()) {
    throw new Error('API-Schlüssel-Name ist erforderlich');
  }

  try {
    return await createApiKey(organizationId, projectId, {
      name: name.trim(),
      state,
      limitInCent,
      expiresAt,
    });
  } catch (error) {
    throw new Error('Fehler beim Erstellen des API-Schlüssels');
  }
}
