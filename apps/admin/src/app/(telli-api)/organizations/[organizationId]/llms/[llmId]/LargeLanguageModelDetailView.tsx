'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';
import { Button } from '@ui/components/button';
import { FormField } from '@ui/components/form/form-field';
import { FormFieldCheckbox } from '@ais-chat/ui/components/form/form-field-checkbox';
import { Controller } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/select';
import { Field, FieldDescription, FieldLabel } from '@ui/components/field';
import { LargeLanguageModel } from '@/types/large-language-model';
import { createLLMAction, updateLLMAction } from './actions';
import { ROUTES } from '@/consts/routes';
import { FormErrorDisplay } from '@/components/FormErrorDisplay';
import { logError } from '@shared/logging';

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
  tier: z.enum(['fast', 'balanced', 'powerful']).nullable().optional(),
  openSource: z.boolean().nullable().optional(),
  dataLocation: z.enum(['eu', 'us', 'other']).nullable().optional(),
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
  } = useForm({
    resolver: zodResolver(llmFormSchema),
    defaultValues: model
      ? {
          name: model.name,
          displayName: model.displayName,
          provider: model.provider,
          description: model.description,
          setting: JSON.stringify(model.setting, null, 2),
          priceMetadata: JSON.stringify(model.priceMetadata, null, 2),
          supportedImageFormats: JSON.stringify(model.supportedImageFormats, null, 2),
          additionalParameters: JSON.stringify(model.additionalParameters, null, 2),
          isNew: model.isNew,
          isDeleted: model.isDeleted,
          tier: model.tier ?? null,
          openSource: model.openSource ?? null,
          dataLocation: model.dataLocation ?? null,
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
          tier: null,
          openSource: null,
          dataLocation: null,
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
        router.push(ROUTES.api.llmDetails(organizationId, newModel.id));
      } else if (model) {
        await updateLLMAction(organizationId, model.id, data);
        toast.success('Sprachmodell erfolgreich aktualisiert');
      }
    } catch (error) {
      logError('Error saving model', error);
      toast.error(
        isCreate
          ? 'Fehler beim Erstellen des Sprachmodells'
          : 'Fehler beim Aktualisieren des Sprachmodells',
      );
    }
  }

  const handleCancel = () => {
    router.push(ROUTES.api.llms(organizationId));
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
        <FormErrorDisplay errors={errors} />

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
            description="Name des Modell-Anbieters (ionos, azure, openai, google)"
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

          <Controller
            name="tier"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="tier">Leistungsstufe</FieldLabel>
                <FieldDescription>Einordnung des Modells für die Matrix-Ansicht</FieldDescription>
                <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                  <SelectTrigger id="tier">
                    <SelectValue placeholder="Nicht zugeordnet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">Schnell</SelectItem>
                    <SelectItem value="balanced">Ausgewogen</SelectItem>
                    <SelectItem value="powerful">Leistungsstark</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            name="dataLocation"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="dataLocation">Datenspeicherort</FieldLabel>
                <FieldDescription>Wo findet die Inferenz statt?</FieldDescription>
                <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                  <SelectTrigger id="dataLocation">
                    <SelectValue placeholder="Nicht angegeben" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eu">EU</SelectItem>
                    <SelectItem value="us">USA</SelectItem>
                    <SelectItem value="other">Sonstige</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <FormFieldCheckbox
            name="openSource"
            label="Open Source"
            description="Modellgewichte sind öffentlich verfügbar"
            control={control}
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
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
