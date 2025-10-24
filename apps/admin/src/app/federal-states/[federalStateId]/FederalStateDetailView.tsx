'use client';
import { Button } from '@ui/components/Button';
import {
  FederalState,
  FederalStateEdit,
  FederalStateEditSchema,
} from '../../../types/federal-state';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateFederalState } from '../../../services/federal-states-service';
import { DesignConfigurationSchema } from '@ui/types/design-configuration';
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
import { FormFieldArray } from '../../../components/form/FormFieldArray';
import { toast } from 'sonner';

export type FederalStateViewProps = {
  federalState: FederalState;
};

export function FederalStateView(props: FederalStateViewProps) {
  const federalState = props.federalState;

  const form = useForm<FederalStateEdit>({
    resolver: zodResolver(FederalStateEditSchema),
    defaultValues: {
      ...federalState,
      // react-hook-form does not support array of primitives, so we map to array of objects
      supportContacts: federalState.supportContacts?.map((s) => ({ value: s })) ?? [],
      // all null values must be converted to empty string
      telliName: federalState.telliName ?? '',
      trainingLink: federalState.trainingLink ?? '',
      // designConfiguration is stringified for the textarea
      designConfiguration: federalState.designConfiguration
        ? JSON.stringify(federalState.designConfiguration, null, 2)
        : '',
    },
  });

  // Destructuring is necessary, otherwise formState is not updated correctly
  // https://www.react-hook-form.com/api/useform/formstate/
  const {
    control,
    formState: { isValid, errors, isDirty },
  } = form;

  async function onSubmit(data: FederalStateEdit) {
    if (!isValid) {
      toast.error('Das Formular enthält ungültige Werte.');
      return;
    }
    try {
      // Parse designConfiguration as JSON if not empty, otherwise set to null
      let parsedDesignConfiguration = null;
      if (data.designConfiguration && data.designConfiguration.trim() !== '') {
        try {
          parsedDesignConfiguration = DesignConfigurationSchema.parse(
            JSON.parse(data.designConfiguration),
          );
        } catch {
          toast.error('Fehler: designConfiguration ist nicht im korrekten Format');
          return;
        }
      }

      await updateFederalState({
        ...data,
        supportContacts: data.supportContacts.map((s) => s.value),
        designConfiguration: data.designConfiguration === '' ? null : parsedDesignConfiguration,
      });
      toast.success('Bundesland erfolgreich aktualisiert');
    } catch {
      toast.error('Fehler beim Aktualisieren des Bundeslands');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bundesland Detailansicht</CardTitle>
        <CardDescription>Details zum Bundesland {federalState.id}</CardDescription>
        {Object.keys(errors).length > 0 && (
          <div className="text-red-500">{JSON.stringify(errors)}</div>
        )}
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-8" onSubmit={form.handleSubmit(onSubmit)}>
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

          <FormFieldCheckbox
            name="studentAccess"
            label="Zugriff für Lernende erlaubt?"
            description="Erlaubt den Zugriff auch für Lernende."
            control={control}
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
            label="Support Emailadressen"
            description="Emailadressen die im Supportfall benutzt werden können. Diese werden im Disclaimer angezeigt."
            control={control}
            inputType="email"
          />

          <FormFieldCheckbox
            name="enableCharacter"
            label="Aktiviere Dialogpartner"
            description="Schaltet die Verwendung von Dialogpartnern frei."
            control={control}
          />

          <FormFieldCheckbox
            name="enableCustomGpt"
            label="Aktiviere Assistenten"
            description="Schaltet die Verwendung von Assistenten frei."
            control={control}
          />
          <FormFieldCheckbox
            name="enableSharedChats"
            label="Lernszenarien aktivieren"
            description="Schaltet die Verwendung von Lernszenarien frei."
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
