'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';
import { Checkbox } from '@ui/components/checkbox';
import { Field, FieldError, FieldLabel } from '@ui/components/field';
import { FormField } from '@ui/components/form/form-field';
import { FormFieldCheckbox } from '@ui/components/form/form-field-checkbox';
import { Input } from '@ui/components/input';
import { FormErrorDisplay } from '@/components/FormErrorDisplay';
import { ROUTES } from '@/consts/routes';
import type { LargeLanguageModel } from '@/types/large-language-model';
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
  modelAssignments: z.array(
    z
      .object({
        modelId: z.string(),
        selected: z.boolean(),
        upstreamModelName: z.string(),
      })
      .refine(
        ({ selected, upstreamModelName }) => !selected || upstreamModelName.trim().length > 0,
        {
          message: 'Für ausgewählte Modelle ist ein Upstream-Modellname erforderlich',
          path: ['upstreamModelName'],
        },
      ),
  ),
});

type ProviderKeyForm = z.infer<typeof providerKeyFormSchema>;

export function ProviderKeyDetailView({
  organizationId,
  providerKey,
  models,
  mode,
}: {
  organizationId: string;
  providerKey?: ProviderKey;
  models: LargeLanguageModel[];
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const isCreate = mode === 'create';
  const assignments = new Map(
    providerKey?.models.map(({ model, upstreamModelName }) => [model.id, upstreamModelName]),
  );
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
      modelAssignments: models.map((model) => ({
        modelId: model.id,
        selected: assignments.has(model.id),
        upstreamModelName: assignments.get(model.id) ?? model.name,
      })),
    },
  });

  async function onSubmit(data: ProviderKeyForm) {
    const payload = {
      name: data.name,
      provider: data.provider,
      settings: data.settings,
      weight: data.weight,
      isEnabled: data.isEnabled,
      models: data.modelAssignments
        .filter(({ selected }) => selected)
        .map(({ modelId, upstreamModelName }) => ({
          modelId,
          upstreamModelName: upstreamModelName.trim(),
        })),
    };

    try {
      if (isCreate) {
        const created = await createProviderKeyAction(organizationId, payload);
        toast.success('Provider-Schlüssel erfolgreich erstellt');
        router.push(ROUTES.api.providerKeyDetails(organizationId, created.id));
      } else if (providerKey) {
        await updateProviderKeyAction(organizationId, providerKey.id, payload);
        toast.success('Provider-Schlüssel erfolgreich aktualisiert');
      }
    } catch (error) {
      logError('Error saving provider key', error);
      toast.error(
        isCreate
          ? 'Fehler beim Erstellen des Provider-Schlüssels'
          : 'Fehler beim Aktualisieren des Provider-Schlüssels',
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isCreate
            ? 'Neuen Provider-Schlüssel erstellen'
            : `Provider-Schlüssel bearbeiten: ${providerKey?.name}`}
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

          <div className="flex flex-col gap-3">
            <div>
              <h2 className="font-medium">Modellzuweisungen</h2>
              <p className="text-muted-foreground text-sm">
                Upstream-Modellname für jedes ausgewählte logische Modell festlegen.
              </p>
            </div>
            {models.length === 0 && (
              <p className="text-muted-foreground text-sm">Keine Sprachmodelle vorhanden.</p>
            )}
            {models.map((model, index) => (
              <Controller
                key={model.id}
                name={`modelAssignments.${index}`}
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="rounded-md border p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`model-${model.id}`}
                        checked={field.value.selected}
                        onCheckedChange={(selected) =>
                          field.onChange({ ...field.value, selected: selected === true })
                        }
                      />
                      <FieldLabel htmlFor={`model-${model.id}`} className="min-w-48">
                        {model.displayName || model.name}
                      </FieldLabel>
                      <Input
                        aria-label={`Upstream-Modellname für ${model.displayName || model.name}`}
                        value={field.value.upstreamModelName}
                        onChange={(event) =>
                          field.onChange({ ...field.value, upstreamModelName: event.target.value })
                        }
                        disabled={!field.value.selected}
                        placeholder="Upstream-Modellname"
                      />
                    </div>
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            ))}
          </div>

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
