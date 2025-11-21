'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProjectByIdAction, getApiKeysAction } from '../actions';
import { Project } from '../../../../../../types/project';
import { ApiKey } from '../../../../../../types/api-key';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/Table';
import { Button } from '@ui/components/Button';
import { toast } from 'sonner';
import Link from 'next/link';
import { ROUTES } from '../../../../../../consts/routes';
import { Search } from 'lucide-react';

export type ProjectDetailViewProps = {
  organizationId: string;
  projectId: string;
};

export default function ProjectDetailView(props: ProjectDetailViewProps) {
  const { organizationId, projectId } = props;
  const [project, setProject] = useState<Project | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKeysLoading, setApiKeysLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKeysError, setApiKeysError] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const projectData = await getProjectByIdAction(organizationId, projectId);
      setProject(projectData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten.';
      setError(errorMessage);
      toast.error(`Fehler beim Laden des Projekts: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [organizationId, projectId]);

  const loadApiKeys = useCallback(async () => {
    try {
      setApiKeysLoading(true);
      setApiKeysError(null);
      const apiKeysData = await getApiKeysAction(organizationId, projectId);
      setApiKeys(apiKeysData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten.';
      setApiKeysError(errorMessage);
      toast.error(`Fehler beim Laden der API-Schlüssel: ${errorMessage}`);
    } finally {
      setApiKeysLoading(false);
    }
  }, [organizationId, projectId]);

  useEffect(() => {
    loadProject();
    loadApiKeys();
  }, [organizationId, projectId, loadProject, loadApiKeys]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div>Lädt Projektdetails...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-red-600">Fehler: {error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div>Projekt nicht gefunden.</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle>Projektdetails</CardTitle>
          <CardDescription>Informationen zum Projekt {project.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <span className="font-semibold">ID:</span> {project.id}
            </div>
            <div>
              <span className="font-semibold">Name:</span> {project.name}
            </div>
            <div>
              <span className="font-semibold">Organisation ID:</span> {project.organizationId}
            </div>
            <div>
              <span className="font-semibold">Erstellt am:</span>{' '}
              {new Date(project.createdAt).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API-Schlüssel</CardTitle>
              <CardDescription>API-Schlüssel für dieses Projekt</CardDescription>
            </div>
            <Link href={ROUTES.api.apiKeyNew(organizationId, projectId)}>
              <Button disabled={apiKeysLoading}>Neuen API-Schlüssel erstellen</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {apiKeysLoading ? (
            <div>Lädt API-Schlüssel...</div>
          ) : apiKeysError ? (
            <div className="text-red-600">Fehler beim Laden der API-Schlüssel: {apiKeysError}</div>
          ) : apiKeys.length === 0 ? (
            <div className="text-gray-500">Keine API-Schlüssel vorhanden.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Id</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Limit in Cent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erstellt am</TableHead>
                  <TableHead>Läuft ab am</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell>{apiKey.id}</TableCell>
                    <TableCell>{apiKey.name}</TableCell>
                    <TableCell>{apiKey.limitInCent}</TableCell>
                    <TableCell>{apiKey.state}</TableCell>
                    <TableCell>{new Date(apiKey.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      {apiKey.expiresAt ? new Date(apiKey.expiresAt).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Link
                          href={ROUTES.api.apiKeyModelMappings(
                            organizationId,
                            projectId,
                            apiKey.id,
                          )}
                        >
                          <Button>Sprachmodelle</Button>
                        </Link>
                        <Link href={ROUTES.api.apiKeyDetails(organizationId, projectId, apiKey.id)}>
                          <Search className="text-primary" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
