'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';
import { FormField } from '@ui/components/form/form-field';
import { FormFieldCheckbox } from '@ui/components/form/form-field-checkbox';
import { FormErrorDisplay } from '@/components/FormErrorDisplay';
import { ROUTES } from '@/consts/routes';
import type { ProviderKey } from '@/types/provider-key';
import { logError } from '@shared/logging';
import { createProviderKeyAction, updateProviderKeyAction } from './actions';

const providerKeyFormSchema = z.object({
  name: z.string().trim().min(1, 'Name ist erforderlich'),
  provider: z.string().trim().min(1, 'Provider ist erforderlich'),
  settings: z.string().refine((value) => {
    try {
      return typeof JSON.parse(value) === 'object';
    } catch {
      return false;
    }
  }, 'Einstellungen müssen gültiges JSON sein'),
  weight: z.number().positive('Gewichtung muss größer als 0 sein'),
  isEnabled: z.boolean(),
});

type ProviderKeyForm = z.infer<typeof providerKeyFormSchema>;

export function ProviderKeyDetailView({
  organizationId,
  providerKey,
  mode,
}: {
  organizationId: string;
  providerKey?: ProviderKey;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const isCreate = mode === 'create';
  const {
    control,
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
  } = useForm<ProviderKeyForm>({
    resolver: zodResolver(providerKeyFormSchema),
    defaultValues: {
      name: providerKey?.name ?? '',
      provider: providerKey?.provider ?? '',
      settings: providerKey ? JSON.stringify(providerKey.settings, null, 2) : '{}',
      weight: providerKey?.weight ?? 1,
      isEnabled: providerKey?.isEnabled ?? true,
    },
  });

  async function onSubmit(data: ProviderKeyForm) {
    const payload = {
      name: data.name,
      provider: data.provider,
      settings: data.settings,
      weight: data.weight,
      isEnabled: data.isEnabled,
    };

    try {
      if (isCreate) {
        const result = await createProviderKeyAction(organizationId, payload);
        if (!result.success) throw new Error(result.error.message);
        toast.success('Provider-Key erfolgreich erstellt');
        router.push(ROUTES.api.providerKeyDetails(organizationId, result.value.id));
      } else if (providerKey) {
        const result = await updateProviderKeyAction(organizationId, providerKey.id, payload);
        if (!result.success) throw new Error(result.error.message);
        toast.success('Provider-Key erfolgreich aktualisiert');
      }
    } catch (error) {
      logError('Error saving provider key', error);
      toast.error(
        isCreate
          ? 'Fehler beim Erstellen des Provider-Keys'
          : 'Fehler beim Aktualisieren des Provider-Keys',
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isCreate
            ? 'Neuen Provider-Key erstellen'
            : `Provider-Key bearbeiten: ${providerKey?.name}`}
        </CardTitle>
        <CardDescription>
          Provider-Zugang konfigurieren und logischen Sprachmodellen zuweisen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormErrorDisplay errors={errors} />
        <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
          <FormField name="name" label="Name" control={control} required />
          <FormField
            name="provider"
            label="Provider"
            description="ionos, openai, azure oder google; muss dem Provider in den Einstellungen entsprechen"
            control={control}
            required
          />
          <FormField
            name="settings"
            label="Einstellungen"
            description="Provider-spezifische JSON-Konfiguration einschließlich Zugangsdaten"
            control={control}
            type="textArea"
            required
            className="min-h-40 font-mono"
          />
          <FormField name="weight" label="Gewichtung" control={control} type="number" required />
          <FormFieldCheckbox name="isEnabled" label="Aktiv" control={control} />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => router.push(ROUTES.api.providerKeys(organizationId))}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting || (!isDirty && !isCreate)}>
              {isCreate ? 'Erstellen' : 'Speichern'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
