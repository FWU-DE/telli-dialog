'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/Table';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/Card';
import { Button } from '@ui/components/Button';
import { Checkbox } from '@ui/components/Checkbox';
import { toast } from 'sonner';
import {
  getModelMappingsAction,
  getLargeLanguageModelsAction,
  saveModelMappingsAction,
} from './actions';
import { LargeLanguageModel } from '../../../../../../../../../types/large-language-model';
import { ModelApiKeyMapping } from '../../../../../../../../../types/model-mappings';

export type ModelApiKeyMappingListViewProps = {
  organizationId: string;
  projectId: string;
  apiKeyId: string;
};

export function ModelApiKeyMappingListView({
  organizationId,
  projectId,
  apiKeyId,
}: ModelApiKeyMappingListViewProps) {
  const [availableModels, setAvailableModels] = useState<LargeLanguageModel[]>([]);
  const [modelApiKeyMappings, setModelApiKeyMappings] = useState<ModelApiKeyMapping[]>([]);
  const [assignedModelIds, setAssignedModelIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [organizationId, projectId, apiKeyId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [mappings, models] = await Promise.all([
        getModelMappingsAction(organizationId, projectId, apiKeyId),
        getLargeLanguageModelsAction(organizationId),
      ]);

      setModelApiKeyMappings(mappings);
      setAvailableModels(models);
      setAssignedModelIds(
        new Set(mappings.map((mapping: ModelApiKeyMapping) => mapping.llmModelId)),
      );
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setIsLoading(false);
    }
  };
  const handleModelToggle = (modelId: string, checked: boolean) => {
    setAssignedModelIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(modelId);
      } else {
        newSet.delete(modelId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveModelMappingsAction(
        organizationId,
        projectId,
        apiKeyId,
        Array.from(assignedModelIds),
      );
      toast.success('Zuordnungen erfolgreich gespeichert');
      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error('Error saving assignments:', error);
      toast.error('Fehler beim Speichern der Zuordnungen');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Lade Modelle...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modell-Zuordnungen</CardTitle>
        <CardDescription>
          Verfügbare Modelle für diesen API-Schlüssel. Wählen Sie die Modelle aus, die diesem
          API-Schlüssel zugeordnet werden sollen.
        </CardDescription>
        <CardAction>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Speichere...' : 'Zuordnungen speichern'}
          </Button>
          <Button onClick={loadData} disabled={isLoading} className="ml-2">
            Aktualisieren
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Zugeordnet</TableHead>
              <TableHead>Modell Name</TableHead>
              <TableHead>Anbieter</TableHead>
              <TableHead>Beschreibung</TableHead>
              <TableHead>Erstellt am</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {availableModels.map((model) => {
              const isAssigned = assignedModelIds.has(model.id);
              const mapping = modelApiKeyMappings.find((m) => m.llmModelId === model.id);

              return (
                <TableRow key={model.id}>
                  <TableCell>
                    <Checkbox
                      checked={isAssigned}
                      onCheckedChange={(checked) => handleModelToggle(model.id, checked as boolean)}
                      aria-label={`${model.displayName || model.name} zugeordnet`}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{model.displayName || model.name}</div>
                      {model.displayName && model.name !== model.displayName && (
                        <div className="text-sm text-gray-500">{model.name}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {model.provider}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={model.description}>
                      {model.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {mapping ? new Date(mapping.createdAt).toLocaleString() : '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
