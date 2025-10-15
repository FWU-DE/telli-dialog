'use client';
import Link from 'next/dist/client/link';
import { Button } from '@ui/components/Button';
import { Checkbox } from '@ui/components/Checkbox';
import { Input } from '@ui/components/Input';
import { Label } from '@ui/components/Label';
import { Textarea } from '@ui/components/Textarea';
import { FederalStateSchema, FederalState } from '../../../types/federal-state';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateFederalState } from '../../../services/federal-states-service';

export type FederalStateViewProps = {
  federalState: FederalState;
};

export function FederalStateView(props: FederalStateViewProps) {
  const federalState = props.federalState;
  // Id should not be editable
  const FederalStateEditSchema = FederalStateSchema.extend({
    id: z.literal(federalState.id),
    supportContacts: z.array(
      z.object({
        value: z.string(),
      }),
    ),
  });
  type FederalStateEdit = z.infer<typeof FederalStateEditSchema>;
  const {
    register,
    handleSubmit,
    control,
    formState: { isValid },
  } = useForm<FederalStateEdit>({
    resolver: zodResolver(FederalStateEditSchema),
    defaultValues: {
      ...federalState,
      supportContacts: federalState.supportContacts?.map((s) => ({ value: s })) ?? [],
      designConfiguration: federalState.designConfiguration
        ? JSON.stringify(federalState.designConfiguration, null, 2)
        : '',
    },
  });
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
          parsedDesignConfiguration = JSON.parse(data.designConfiguration);
        } catch {
          alert('Fehler: designConfiguration ist kein gültiges JSON');
          return;
        }
      }

      // trainingLink, designConfiguration, telliName can be null, but the form returns '' when empty
      await updateFederalState({
        ...data,
        supportContacts: data.supportContacts.map((s) => s.value),
        trainingLink: data.trainingLink === '' ? null : data.trainingLink,
        designConfiguration: data.designConfiguration === '' ? null : parsedDesignConfiguration,
        telliName: data.telliName === '' ? null : data.telliName,
      });
      alert('Bundesland erfolgreich aktualisiert');
    } catch (error) {
      console.error('Failed to update federal state:', error);
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
      <div>
        <Label>id</Label>
        <Input value={federalState.id} disabled />
      </div>
      <div>
        <Label>telliName</Label>
        <Input {...register('telliName')} />
      </div>
      <div>
        <Label>CreatedAt</Label>
        <Input value={federalState.createdAt} disabled />
      </div>
      <div>
        <Label>teacherPriceLimit</Label>
        <Input type="number" {...register('teacherPriceLimit', { valueAsNumber: true })} />
      </div>
      <div>
        <Label>studentAccess</Label>
        <Checkbox {...register('studentAccess')} />
      </div>
      <div>
        <Label>studentPriceLimit</Label>
        <Input type="number" {...register('studentPriceLimit', { valueAsNumber: true })} />
      </div>
      <div>
        <Label>chatStorageTime</Label>
        <Input type="number" {...register('chatStorageTime', { valueAsNumber: true })} />
      </div>
      <div>
        <Label>mandatoryCertificationTeacher</Label>
        <Checkbox {...register('mandatoryCertificationTeacher')} />
      </div>
      <div>
        <Label>trainingLink</Label>
        <Input {...register('trainingLink')} />
      </div>
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
      <div>
        <Label>enableCharacter</Label>
        <Checkbox {...register('enableCharacter')} />
      </div>
      <div>
        <Label>enableCustomGpt</Label>
        <Checkbox {...register('enableCustomGpt')} />
      </div>
      <div>
        <Label>enableSharedChats</Label>
        <Checkbox {...register('enableSharedChats')} />
      </div>
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
