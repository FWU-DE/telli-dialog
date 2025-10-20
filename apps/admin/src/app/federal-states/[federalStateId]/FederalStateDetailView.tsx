'use client';
import Link from 'next/dist/client/link';
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

export type FederalStateViewProps = {
  federalState: FederalState;
};

export function FederalStateView(props: FederalStateViewProps) {
  const federalState = props.federalState;

  const form = useForm<FederalStateEdit>({
    resolver: zodResolver(FederalStateEditSchema),
    defaultValues: {
      ...federalState,
      supportContacts: federalState.supportContacts?.map((s) => ({ value: s })) ?? [],
      designConfiguration: federalState.designConfiguration
        ? JSON.stringify(federalState.designConfiguration, null, 2)
        : '',
    },
  });

  async function onSubmit(data: FederalStateEdit) {
    if (!form.formState.isValid) {
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
          alert('Fehler: designConfiguration ist nicht im korrekten Format');
          return;
        }
      }

      // trainingLink, designConfiguration, telliName can be null, but the form returns '' when empty
      await updateFederalState({
        ...data,
        supportContacts: data.supportContacts.map((s) => s.value),
        trainingLink: data.trainingLink,
        designConfiguration: data.designConfiguration === '' ? null : parsedDesignConfiguration,
      });
      alert('Bundesland erfolgreich aktualisiert');
    } catch {
      alert('Fehler beim Aktualisieren des Bundeslands');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bundesland Detailansicht</CardTitle>
        <CardDescription>Details zum Bundesland {federalState.id}</CardDescription>
        <CardAction>
          <Link href={`/federal-states/${federalState.id}/vouchers`}>
            <Button type="button">Guthaben Codes</Button>
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-8" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            name="id"
            label="ID"
            description="Eindeutige ID des Bundeslandes."
            control={form.control}
            disabled
          />

          <FormField
            name="createdAt"
            label="Erstellt am"
            description="Datum, an dem das Bundesland erstellt wurde."
            control={form.control}
            disabled
          />

          <FormField
            name="telliName"
            label="Name"
            description="Beschreibender Name für das Bundesland."
            control={form.control}
          />

          <FormField
            name="teacherPriceLimit"
            label="Preislimit für Unterrichtende"
            description="Legt das Preislimit (in Cent) für Unterrichtende pro Monat fest."
            control={form.control}
            type="number"
          />

          <FormFieldCheckbox
            name="studentAccess"
            label="Zugriff für Lernende erlaubt?"
            description="Erlaubt den Zugriff auch für Lernende."
            control={form.control}
          />

          <FormField
            name="studentPriceLimit"
            label="Preislimit für Lernende"
            description="Legt das Preislimit (in Cent) für Lernende pro Monat fest."
            control={form.control}
            type="number"
          />

          <FormField
            name="chatStorageTime"
            label="Speicherzeit für Chats"
            description="Legt die Speicherzeit (in Tagen) für Chats fest."
            control={form.control}
            type="number"
          />

          <FormFieldCheckbox
            name="mandatoryCertificationTeacher"
            label="Pflichtschulung für Unterrichtende aktivieren"
            description="Lehrer müssen zuerst eine Schulung abschließen bevor die Verwendung erlaubt wird."
            control={form.control}
          />

          <FormField
            name="trainingLink"
            label="Link für die Schulung"
            description="Legt den Link für die Schulung fest."
            control={form.control}
          />

          <FormFieldArray
            name="supportContacts"
            label="Support Emailadressen"
            description="Emailadressen die im Supportfall benutzt werden können. Diese werden im Disclaimer angezeigt."
            control={form.control}
            inputType="email"
          />

          <FormFieldCheckbox
            name="enableCharacter"
            label="Aktiviere Dialogpartner"
            description="Schaltet die Verwendung von Dialogpartnern frei."
            control={form.control}
          />

          <FormFieldCheckbox
            name="enableCustomGpt"
            label="Aktiviere Assistenten"
            description="Schaltet die Verwendung von Assistenten frei."
            control={form.control}
          />
          <FormFieldCheckbox
            name="enableSharedChats"
            label="Lernszenarien aktivieren"
            description="Schaltet die Verwendung von Lernszenarien frei."
            control={form.control}
          />

          <FormField
            name="designConfiguration"
            label="Design Konfiguration"
            description="Legt die Hauptfarben für die Anwendung fest."
            control={form.control}
            type="textArea"
          />

          <CardAction>
            <Button type="submit">Speichern</Button>
          </CardAction>
        </form>
      </CardContent>
    </Card>
  );
}
