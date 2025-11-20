'use client';

import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/Card';
import { Button } from '@ui/components/Button';
import { FormField } from '@ui/components/form/FormField';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/Select';
import { ApiKey } from '@/types/api-key';
import { createApiKeyAction, updateApiKeyAction } from './actions';
import { ROUTES } from '@/consts/routes';
import React, { useState } from 'react';
import { Input } from '@ui/components/Input';
import { Label } from '@ui/components/Label';
import { Field, FieldDescription, FieldError, FieldLabel } from '@ui/components/Field';

const apiKeyFormSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  state: z.enum(['active', 'inactive', 'deleted']).default('active'),
  limitInCent: z.number().nonnegative().optional(),
  expiresAt: z.date().optional().nullable(),
});

type ApiKeyForm = z.infer<typeof apiKeyFormSchema>;

export type ApiKeyDetailViewProps = {
  organizationId: string;
  projectId: string;
  apiKey?: ApiKey;
  mode: 'create' | 'edit';
};

export function ApiKeyDetailView({
  organizationId,
  projectId,
  apiKey,
  mode,
}: ApiKeyDetailViewProps) {
  const router = useRouter();
  const isCreate = mode === 'create';
  const [createdApiKey, setCreatedApiKey] = useState<{ plainKey: string; name: string } | null>(
    null,
  );

  const {
    control,
    formState: { isValid, errors, isSubmitting, isDirty },
    handleSubmit,
    reset,
    watch,
  } = useForm<ApiKeyForm>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: apiKey
      ? {
          name: apiKey.name,
          state: apiKey.state,
          limitInCent: apiKey.limitInCent || undefined,
          expiresAt: apiKey.expiresAt || null,
        }
      : {
          name: '',
          state: 'active',
          limitInCent: undefined,
          expiresAt: null,
        },
  });

  // Convert expiresAt date to string for the datetime-local input
  const formatDateTimeLocal = (date: Date | null | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  // Parse datetime-local string back to Date
  const parseDateTimeLocal = (dateStr: string): Date | null => {
    return dateStr ? new Date(dateStr) : null;
  };

  async function onSubmit(data: ApiKeyForm) {
    if (!isValid) {
      toast.error('Das Formular enthält ungültige Werte.');
      return;
    }

    try {
      if (isCreate) {
        const result = await createApiKeyAction(
          organizationId,
          projectId,
          data.name,
          data.state,
          data.limitInCent,
          data.expiresAt,
        );

        // Show the plainKey to the user - this is critical as it can't be retrieved later
        setCreatedApiKey({
          plainKey: result.plainKey, // The API returns plainKey on creation
          name: result.name,
        });

        toast.success('API-Schlüssel erfolgreich erstellt');
      } else if (apiKey) {
        await updateApiKeyAction(
          organizationId,
          projectId,
          apiKey.id,
          data.name,
          data.state,
          data.limitInCent,
          data.expiresAt,
        );
        toast.success('API-Schlüssel erfolgreich aktualisiert');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error(
        isCreate
          ? 'Fehler beim Erstellen des API-Schlüssels'
          : 'Fehler beim Aktualisieren des API-Schlüssels',
      );
    }
  }

  const handleCancel = () => {
    router.push(ROUTES.api.projectDetails(organizationId, projectId));
  };

  const handleClose = () => {
    setCreatedApiKey(null);
    router.push(ROUTES.api.projectDetails(organizationId, projectId));
  };

  // Show the created API key with plainKey
  if (createdApiKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API-Schlüssel erfolgreich erstellt!</CardTitle>
          <CardDescription>
            Ihr API-Schlüssel wurde erstellt. Kopieren Sie ihn jetzt!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center mb-2">
                <svg
                  className="h-5 w-5 text-green-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium text-green-800">
                  API-Schlüssel erstellt: {createdApiKey.name}
                </span>
              </div>
              <div className="text-sm text-green-700 mb-3">
                <strong>⚠️ WICHTIG:</strong> Kopieren Sie diesen Schlüssel jetzt! Er kann später
                nicht mehr angezeigt werden und wird für die API-Authentifizierung benötigt.
              </div>
            </div>

            <div>
              <Label htmlFor="plainKey">API-Schlüssel (Plain Key)</Label>
              <div className="flex space-x-2">
                <Input
                  id="plainKey"
                  type="text"
                  value={createdApiKey.plainKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(createdApiKey.plainKey);
                    toast.success('API-Schlüssel in Zwischenablage kopiert');
                  }}
                >
                  Kopieren
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Schließen</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isCreate ? 'Neuen API-Schlüssel erstellen' : `API-Schlüssel bearbeiten: ${apiKey?.name}`}
        </CardTitle>
        <CardDescription>
          {isCreate
            ? 'Erstellen Sie einen neuen API-Schlüssel für dieses Projekt.'
            : 'Bearbeiten Sie die Eigenschaften dieses API-Schlüssels.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {Object.keys(errors).length > 0 && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <p className="font-medium">Bitte korrigieren Sie die folgenden Fehler:</p>
            <ul className="list-disc list-inside mt-2">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>{error?.message}</li>
              ))}
            </ul>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <FormField
            name="name"
            label="Name *"
            description="Name des API-Schlüssels"
            control={control}
          />

          <Controller
            name="state"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Status</FieldLabel>
                <FieldDescription>Status des API-Schlüssels</FieldDescription>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="inactive">Inaktiv</SelectItem>
                    <SelectItem value="deleted">Gelöscht</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <FormField
            name="limitInCent"
            label="Limit in Cent (optional)"
            description="Ausgabenlimit für diesen API-Schlüssel"
            control={control}
            type="number"
          />

          <div>
            <Label htmlFor="expiresAt">Läuft ab am (optional)</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={formatDateTimeLocal(watch('expiresAt'))}
              onChange={(e) => {
                const newValue = parseDateTimeLocal(e.target.value);
                reset({
                  ...watch(),
                  expiresAt: newValue,
                });
              }}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting || (!isDirty && !isCreate)}>
              {isSubmitting
                ? isCreate
                  ? 'Erstelle...'
                  : 'Speichere...'
                : isCreate
                  ? 'Erstellen'
                  : 'Speichern'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
