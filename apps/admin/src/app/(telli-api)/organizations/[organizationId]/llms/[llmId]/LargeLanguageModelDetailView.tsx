'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/Card';
import { Button } from '@ui/components/Button';
import { FormField } from '@ui/components/form/FormField';
import { FormFieldCheckbox } from '@ui/components/form/FormFieldCheckbox';
import { LargeLanguageModel } from '../../../../../../types/large-language-model';
import { createLLMAction, updateLLMAction } from './actions';

// Helper function to validate JSON
const jsonStringSchema = z.string().refine((str) => {
  if (!str.trim()) return true; // Empty string is valid
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}, 'Muss ein gültiges JSON-Format sein');

const llmFormSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  displayName: z.string().min(1, 'Anzeigename ist erforderlich'),
  provider: z.string().min(1, 'Anbieter ist erforderlich'),
  description: z.string().optional().default(''),
  setting: jsonStringSchema.optional().default(''),
  priceMetadata: jsonStringSchema.optional().default(''),
  supportedImageFormats: jsonStringSchema.optional().default(''),
  additionalParameters: jsonStringSchema.optional().default(''),
  isNew: z.boolean().default(false),
  isDeleted: z.boolean().default(false),
});

type LLMForm = z.infer<typeof llmFormSchema>;

export type LargeLanguageModelDetailViewProps = {
  organizationId: string;
  model?: LargeLanguageModel;
  mode: 'create' | 'edit';
};

export function LargeLanguageModelDetailView({
  organizationId,
  model,
  mode,
}: LargeLanguageModelDetailViewProps) {
  const router = useRouter();
  const isCreate = mode === 'create';

  const {
    control,
    formState: { isValid, errors, isSubmitting, isDirty },
    handleSubmit,
    reset,
  } = useForm<LLMForm>({
    resolver: zodResolver(llmFormSchema),
    defaultValues: model
      ? {
          name: model.name,
          displayName: model.displayName,
          provider: model.provider,
          description: model.description || '',
          setting:
            typeof model.setting === 'object'
              ? JSON.stringify(model.setting, null, 2)
              : model.setting || '',
          priceMetadata:
            typeof model.priceMetadata === 'object'
              ? JSON.stringify(model.priceMetadata, null, 2)
              : model.priceMetadata || '',
          supportedImageFormats: Array.isArray(model.supportedImageFormats)
            ? JSON.stringify(model.supportedImageFormats, null, 2)
            : model.supportedImageFormats || '',
          additionalParameters:
            typeof model.additionalParameters === 'object'
              ? JSON.stringify(model.additionalParameters, null, 2)
              : model.additionalParameters || '',
          isNew: model.isNew,
          isDeleted: model.isDeleted,
        }
      : {
          name: '',
          displayName: '',
          provider: '',
          description: '',
          setting: '{}',
          priceMetadata: '{}',
          supportedImageFormats: '[]',
          additionalParameters: '{}',
          isNew: false,
          isDeleted: false,
        },
  });

  async function onSubmit(data: LLMForm) {
    if (!isValid) {
      toast.error('Das Formular enthält ungültige Werte.');
      return;
    }

    try {
      if (isCreate) {
        const newModel = await createLLMAction(organizationId, data);
        toast.success('Sprachmodell erfolgreich erstellt');
        router.push(`/organizations/${organizationId}/llms/${newModel.id}`);
      } else if (model) {
        await updateLLMAction(organizationId, model.id, data);
        toast.success('Sprachmodell erfolgreich aktualisiert');
      }
    } catch (error) {
      console.error('Error saving model:', error);
      toast.error(
        isCreate
          ? 'Fehler beim Erstellen des Sprachmodells'
          : 'Fehler beim Aktualisieren des Sprachmodells',
      );
    }
  }

  const handleCancel = () => {
    if (isCreate) {
      router.push(`/organizations/${organizationId}/llms`);
    } else if (model) {
      reset({
        name: model.name,
        displayName: model.displayName,
        provider: model.provider,
        description: model.description || '',
        setting:
          typeof model.setting === 'object'
            ? JSON.stringify(model.setting, null, 2)
            : model.setting || '',
        priceMetadata:
          typeof model.priceMetadata === 'object'
            ? JSON.stringify(model.priceMetadata, null, 2)
            : model.priceMetadata || '',
        supportedImageFormats: Array.isArray(model.supportedImageFormats)
          ? JSON.stringify(model.supportedImageFormats, null, 2)
          : model.supportedImageFormats || '',
        additionalParameters:
          typeof model.additionalParameters === 'object'
            ? JSON.stringify(model.additionalParameters, null, 2)
            : model.additionalParameters || '',
        isNew: model.isNew,
        isDeleted: model.isDeleted,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isCreate
            ? 'Neues Sprachmodell erstellen'
            : `Sprachmodell bearbeiten: ${model?.displayName || model?.name}`}
        </CardTitle>
        <CardDescription>
          {isCreate
            ? 'Erstellen Sie ein neues Sprachmodell für diese Organisation.'
            : 'Bearbeiten Sie die Eigenschaften dieses Sprachmodells.'}
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
            description="Technischer Name des Modells"
            control={control}
          />

          <FormField
            name="displayName"
            label="Anzeigename *"
            description="Benutzerfreundlicher Name des Modells"
            control={control}
          />

          <FormField
            name="provider"
            label="Anbieter *"
            description="Name des Modell-Anbieters (ionos, azure, openai)"
            control={control}
          />

          <FormField
            name="description"
            label="Beschreibung"
            description="Kurze Beschreibung des Modells"
            control={control}
            type="textArea"
          />

          <FormField
            name="setting"
            label="Einstellungen"
            description="JSON-Konfiguration für das Modell"
            control={control}
            type="textArea"
          />

          <FormField
            name="priceMetadata"
            label="Preis-Metadaten"
            description="JSON mit Preisinformationen"
            control={control}
            type="textArea"
          />

          <FormField
            name="supportedImageFormats"
            label="Unterstützte Bildformate"
            description="JSON-Array mit unterstützten Bildformaten"
            control={control}
            type="textArea"
          />

          <FormField
            name="additionalParameters"
            label="Zusätzliche Parameter"
            description="JSON mit weiteren Parametern"
            control={control}
            type="textArea"
          />

          <FormFieldCheckbox
            name="isNew"
            label="Als neu markieren"
            description="Kennzeichnet das Modell als neu"
            control={control}
          />

          <FormFieldCheckbox
            name="isDeleted"
            label="Als gelöscht markieren"
            description="Kennzeichnet das Modell als gelöscht"
            control={control}
          />

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
