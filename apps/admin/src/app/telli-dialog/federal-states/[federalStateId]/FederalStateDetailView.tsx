'use client';
import { Button } from '@ui/components/Button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateFederalStateAction } from './actions';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/Card';
import { FormField } from '@ui/components/form/FormField';
import { FormFieldCheckbox } from '@ui/components/form/FormFieldCheckbox';
import { FormFieldArray } from '../../../../components/form/FormFieldArray';
import { toast } from 'sonner';
import z from 'zod';
import { FederalStateModel, federalStateSchema } from '@shared/federal-states/types';
import { DesignConfigurationSchema } from '@ui/types/design-configuration';
import { useEffect } from 'react';
import { FormErrorDisplay } from '@/components/FormErrorDisplay';

export type FederalStateViewProps = {
  federalState: FederalStateModel;
};

// Form-specific schema that extends the base schema with UI adaptations
export const federalStateEditFormSchema = federalStateSchema.extend({
  supportContacts: z.array(
    z.object({
      value: z.string(),
    }),
  ),
  designConfiguration: z.string(), // Will be parsed as JSON before submitting
});

export type FederalStateEditForm = z.infer<typeof federalStateEditFormSchema>;

// Parse string as designConfiguration if not empty, otherwise set to null
function parseAsDesignConfiguration(value: string | null) {
  if (!value || value.trim() === '') {
    return null;
  }
  return DesignConfigurationSchema.parse(JSON.parse(value));
}

function transformToFederalStateEditForm(federalState: FederalStateModel): FederalStateEditForm {
  return {
    ...federalState,
    // Only transform the fields that need UI-specific formatting
    supportContacts: federalState.supportContacts?.map((s) => ({ value: s })) ?? [],
    designConfiguration: federalState.designConfiguration
      ? JSON.stringify(federalState.designConfiguration, null, 2)
      : '',
  };
}

export function FederalStateView(props: FederalStateViewProps) {
  const { federalState } = props;

  // Destructuring is necessary, otherwise formState is not updated correctly
  // https://www.react-hook-form.com/api/useform/formstate/
  const {
    control,
    formState: { isValid, errors, isDirty, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<FederalStateEditForm>({
    resolver: zodResolver(federalStateEditFormSchema),
    defaultValues: transformToFederalStateEditForm(federalState),
  });

  async function onSubmit(data: FederalStateEditForm) {
    if (!isValid) {
      toast.error('Das Formular enthält ungültige Werte.');
      return;
    }

    let parsedDesignConfiguration = null;
    try {
      parsedDesignConfiguration = parseAsDesignConfiguration(data.designConfiguration);
    } catch {
      toast.error('Fehler: designConfiguration ist nicht im korrekten Format');
      return;
    }

    try {
      // Update existing federal state
      await updateFederalStateAction({
        ...data,
        supportContacts:
          data.supportContacts.length > 0 ? data.supportContacts.map((s) => s.value) : [],
        designConfiguration: parsedDesignConfiguration,
      });
      toast.success('Bundesland erfolgreich aktualisiert');
    } catch (error) {
      console.error('Error saving federal state:', error);
      toast.error('Fehler beim Aktualisieren des Bundeslands');
    }
  }

  useEffect(() => {
    reset(transformToFederalStateEditForm(federalState));
  }, [federalState, reset]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bundesland Detailansicht</CardTitle>
        <CardDescription>Details zum Bundesland {federalState.id}</CardDescription>
        <FormErrorDisplay errors={errors} />
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-8"
          onSubmit={handleSubmit(onSubmit)}
          inert={isSubmitting}
        >
          <FormField
            name="id"
            label="ID"
            description="Eindeutige ID des Bundeslandes."
            control={control}
            disabled
          />

          <FormField
            name="createdAt"
            label="Erstellt am"
            description="Datum, an dem das Bundesland erstellt wurde."
            control={control}
            disabled
          />

          <FormFieldCheckbox
            name="hasApiKeyAssigned"
            label="API Key vorhanden?"
            description="Zeigt an ob bereits ein API Key erstellt wurde. Dieser ist zwingend für die Kommunikation mit telli-api erforderlich."
            control={control}
            disabled
          />

          <FormField
            name="telliName"
            label="Name"
            description="Beschreibender Name für das Bundesland."
            control={control}
          />

          <FormField
            name="teacherPriceLimit"
            label="Preislimit für Unterrichtende"
            description="Legt das Preislimit (in Cent) für Unterrichtende pro Monat fest."
            control={control}
            type="number"
          />

          <FormField
            name="studentPriceLimit"
            label="Preislimit für Lernende"
            description="Legt das Preislimit (in Cent) für Lernende pro Monat fest."
            control={control}
            type="number"
          />

          <FormField
            name="chatStorageTime"
            label="Speicherzeit für Chats"
            description="Legt die Speicherzeit (in Tagen) für Chats fest."
            control={control}
            type="number"
          />

          <FormFieldCheckbox
            name="mandatoryCertificationTeacher"
            label="Pflichtschulung für Unterrichtende aktivieren"
            description="Lehrer müssen zuerst eine Schulung abschließen bevor die Verwendung erlaubt wird."
            control={control}
          />

          <FormField
            name="trainingLink"
            label="Link für die Schulung"
            description="Legt den Link für die Schulung fest."
            control={control}
          />

          <FormFieldArray
            name="supportContacts"
            label="Support Kontaktadressen"
            description="Emailadressen, Telefonnummern oder auch Webadressen die im Supportfall benutzt werden können. Diese werden im Disclaimer angezeigt."
            control={control}
          />

          <FormFieldCheckbox
            name="featureToggles.isStudentAccessEnabled"
            label="Zugriff für Lernende erlaubt?"
            description="Erlaubt den Zugriff auch für Lernende."
            control={control}
          />

          <FormFieldCheckbox
            name="featureToggles.isCharacterEnabled"
            label="Aktiviere Dialogpartner"
            description="Schaltet die Verwendung von Dialogpartnern frei."
            control={control}
          />

          <FormFieldCheckbox
            name="featureToggles.isCustomGptEnabled"
            label="Aktiviere Assistenten"
            description="Schaltet die Verwendung von Assistenten frei."
            control={control}
          />

          <FormFieldCheckbox
            name="featureToggles.isSharedChatEnabled"
            label="Lernszenarien aktivieren"
            description="Schaltet die Verwendung von Lernszenarien frei."
            control={control}
          />

          <FormFieldCheckbox
            name="featureToggles.isShareTemplateWithSchoolEnabled"
            label="Vorlage mit Schule teilen aktivieren"
            description="Schaltet die Möglichkeit frei, Vorlagen mit allen Benutzern einer Schule zu teilen."
            control={control}
          />

          <FormField
            name="designConfiguration"
            label="Design Konfiguration"
            description="Legt die Hauptfarben für die Anwendung fest."
            control={control}
            type="textArea"
          />

          <CardAction>
            <Button type="submit" disabled={!isDirty}>
              Speichern
            </Button>
          </CardAction>
        </form>
      </CardContent>
    </Card>
  );
}
