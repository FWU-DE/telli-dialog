'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/select';
import type { LlmModelSelectModel, StaticModelRole } from '@shared/db/schema';
import { updateStaticModelConfigurationAction } from './actions';

const roles: { role: StaticModelRole; label: string; type: 'text' | 'image' }[] = [
  { role: 'default-chat', label: 'Standard-Chatmodell', type: 'text' },
  { role: 'default-chat-fallback', label: 'Fallback-Chatmodell', type: 'text' },
  { role: 'auxiliary', label: 'Hilfsmodell', type: 'text' },
  { role: 'strong-auxiliary', label: 'Starkes Hilfsmodell', type: 'text' },
  { role: 'auxiliary-fallback', label: 'Fallback-Hilfsmodell', type: 'text' },
  { role: 'default-image', label: 'Standard-Bildmodell', type: 'image' },
];

type Props = {
  models: LlmModelSelectModel[];
  configurations: { role: StaticModelRole; model: LlmModelSelectModel }[];
};

export default function StaticModelConfigurationView({ models, configurations }: Props) {
  const [selected, setSelected] = useState<Record<StaticModelRole, string>>(
    () =>
      Object.fromEntries(configurations.map(({ role, model }) => [role, model.id])) as Record<
        StaticModelRole,
        string
      >,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function save() {
    setIsSubmitting(true);
    try {
      await updateStaticModelConfigurationAction(
        roles
          .map(({ role }) => ({ role, modelId: selected[role] }))
          .filter(({ modelId }) => modelId),
      );
      toast.success('Statische Modelle erfolgreich aktualisiert.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Speichern.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statische Modelle</CardTitle>
        <CardDescription>
          Konfigurieren Sie die global verwendeten Modelle der Chat-App.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {roles.map(({ role, label, type }) => (
          <div className="space-y-2" key={role}>
            <label className="text-sm font-medium">{label}</label>
            <Select
              value={selected[role]}
              onValueChange={(value) => setSelected({ ...selected, [role]: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Modell auswählen" />
              </SelectTrigger>
              <SelectContent>
                {models
                  .filter((model) => model.priceMetadata.type === type && !model.isDeleted)
                  .map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.displayName} ({model.name})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <Button onClick={() => void save()} disabled={isSubmitting}>
          {isSubmitting ? 'Speichert...' : 'Speichern'}
        </Button>
      </CardContent>
    </Card>
  );
}
