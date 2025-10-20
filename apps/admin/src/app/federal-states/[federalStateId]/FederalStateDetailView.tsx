'use client';
import Link from 'next/dist/client/link';
import { Button } from '@ui/components/Button';
import { Checkbox } from '@ui/components/Checkbox';
import { Input } from '@ui/components/Input';
import { Label } from '@ui/components/Label';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@ui/components/Field';
import { Textarea } from '@ui/components/Textarea';
import {
  FederalState,
  FederalStateEdit,
  FederalStateEditSchema,
} from '../../../types/federal-state';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateFederalState } from '../../../services/federal-states-service';
import { DesignConfigurationSchema } from '@ui/types/design-configuration';

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

  const {
    register,
    handleSubmit,
    control,
    formState: { isValid },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'supportContacts',
  });

  async function onSubmit(data: FederalStateEdit) {
    if (!isValid) {
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
        telliName: data.telliName,
      });
      alert('Bundesland erfolgreich aktualisiert');
    } catch {
      alert('Fehler beim Aktualisieren des Bundeslands');
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Bundesland Detailansicht</h1>
        <span className="text-gray-500">({federalState.id})</span>
        <Link href={`/federal-states/${federalState.id}/vouchers`}>
          <Button type="button">Guthaben Codes</Button>
        </Link>
      </div>
      <Controller
        name="id"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>ID</FieldLabel>
            <Input {...field} id={field.name} disabled />
            <FieldDescription>Eindeutige ID des Bundeslandes.</FieldDescription>
          </Field>
        )}
      />
      <Controller
        name="createdAt"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Erstellt am</FieldLabel>
            <Input {...field} id={field.name} disabled />
            <FieldDescription>Datum, an dem das Bundesland erstellt wurde.</FieldDescription>
          </Field>
        )}
      />
      <Controller
        name="telliName"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Name</FieldLabel>
            <Input {...field} id={field.name} />
            <FieldDescription>Erlaubt den Zugriff auch für Schüler.</FieldDescription>
          </Field>
        )}
      />
      <Controller
        name="teacherPriceLimit"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Preislimit für Lehrer</FieldLabel>
            <Input {...field} id={field.name} type="number" />
            <FieldDescription>
              Legt das Preislimit (in Cent) für Lehrer pro Monat fest.
            </FieldDescription>
          </Field>
        )}
      />
      <Controller
        name="studentAccess"
        control={form.control}
        render={({ field, fieldState }) => (
          <FieldSet data-invalid={fieldState.invalid}>
            <FieldLegend variant="label">Student Access</FieldLegend>
            <FieldDescription>Erlaubt den Zugriff auch für Schüler.</FieldDescription>
            <FieldGroup data-slot="checkbox-group">
              <Field orientation="horizontal">
                <Checkbox
                  id="student-access-checkbox"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel htmlFor="student-access-checkbox">Student Access</FieldLabel>
              </Field>
            </FieldGroup>
          </FieldSet>
        )}
      />
      <Controller
        name="studentPriceLimit"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Preislimit für Schüler</FieldLabel>
            <Input {...field} id={field.name} type="number" />
            <FieldDescription>
              Legt das Preislimit (in Cent) für Schüler pro Monat fest.
            </FieldDescription>
          </Field>
        )}
      />
      <Controller
        name="chatStorageTime"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Speicherzeit für Chats</FieldLabel>
            <Input {...field} id={field.name} type="number" />
            <FieldDescription>Legt die Speicherzeit (in Tagen) für Chats fest.</FieldDescription>
          </Field>
        )}
      />
      <Controller
        name="mandatoryCertificationTeacher"
        control={form.control}
        render={({ field, fieldState }) => (
          <FieldSet data-invalid={fieldState.invalid}>
            <FieldLegend variant="label">Mandatory Certification Teacher</FieldLegend>
            <FieldDescription>
              Lehrer müssen zuerst eine Schulung abschließen bevor die Verwendung erlaubt wird.
            </FieldDescription>
            <FieldGroup data-slot="checkbox-group">
              <Field orientation="horizontal">
                <Checkbox
                  id="mandatory-certification-teacher-checkbox"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel htmlFor="mandatory-certification-teacher-checkbox">
                  Mandatory Certification Teacher
                </FieldLabel>
              </Field>
            </FieldGroup>
          </FieldSet>
        )}
      />
      <Controller
        name="trainingLink"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Link für die Schulung</FieldLabel>
            <Input {...field} id={field.name} />
            <FieldDescription>Legt den Link für die Schulung fest.</FieldDescription>
          </Field>
        )}
      />
      <div>
        <Label>supportContacts</Label>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input {...register(`supportContacts.${index}.value` as const)} />
              <Button type="button" variant="destructive" onClick={() => remove(index)}>
                Entfernen
              </Button>
            </div>
          ))}
          <Button type="button" onClick={() => append({ value: '' })}>
            Kontakt hinzufügen
          </Button>
        </div>
      </div>
      <Controller
        name="enableCharacter"
        control={form.control}
        render={({ field, fieldState }) => (
          <FieldSet data-invalid={fieldState.invalid}>
            <FieldLegend variant="label">Enable Character</FieldLegend>
            <FieldDescription>Schaltet die Verwendung von Dialogpartnern frei.</FieldDescription>
            <FieldGroup data-slot="checkbox-group">
              <Field orientation="horizontal">
                <Checkbox
                  id="enable-character-checkbox"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel htmlFor="enable-character-checkbox">Enable Character</FieldLabel>
              </Field>
            </FieldGroup>
          </FieldSet>
        )}
      />
      <Controller
        name="enableCustomGpt"
        control={form.control}
        render={({ field, fieldState }) => (
          <FieldSet data-invalid={fieldState.invalid}>
            <FieldLegend variant="label">Enable Custom GPT</FieldLegend>
            <FieldDescription>Schaltet die Verwendung von Assistenten frei.</FieldDescription>
            <FieldGroup data-slot="checkbox-group">
              <Field orientation="horizontal">
                <Checkbox
                  id="enable-custom-gpt-checkbox"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel htmlFor="enable-custom-gpt-checkbox">Enable Custom GPT</FieldLabel>
              </Field>
            </FieldGroup>
          </FieldSet>
        )}
      />
      <Controller
        name="enableSharedChats"
        control={form.control}
        render={({ field, fieldState }) => (
          <FieldSet data-invalid={fieldState.invalid}>
            <FieldLegend variant="label">Enable Shared Chats</FieldLegend>
            <FieldDescription>Schaltet die Verwendung von geteilten Chats frei.</FieldDescription>
            <FieldGroup data-slot="checkbox-group">
              <Field orientation="horizontal">
                <Checkbox
                  id="enable-shared-chats-checkbox"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel htmlFor="enable-shared-chats-checkbox">Enable Shared Chats</FieldLabel>
              </Field>
            </FieldGroup>
          </FieldSet>
        )}
      />
      <div>
        <Label>designConfiguration</Label>
        <Textarea {...register('designConfiguration')} />
      </div>
      <div className="flex gap-8">
        <Button type="submit">Speichern</Button>
      </div>
    </form>
  );
}
