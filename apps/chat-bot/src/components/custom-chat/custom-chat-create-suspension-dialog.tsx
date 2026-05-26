'use client';

import React from 'react';
import { useMessages } from 'next-intl';
import { EntityType, SuspensionRequestTargetIds } from '@shared/suspension/suspension-service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@ui/components/alert-dialog';
import { useToast } from '../common/toast';
import { Textarea } from '@ui/components/textarea';
import { Field, FieldGroup, FieldLabel } from '@ui/components/field';
import z from 'zod';
import { Controller, useForm } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSuspensionRequestAction } from '@/app/(authed)/(chat-bot)/actions/suspension-actions';

const suspensionFormValuesSchema = z.object({
  reason: z.string().min(1),
  description: z.string().max(500),
});

type CustomChatCreateSuspensionDialogProps = {
  trigger: React.ReactElement;
  entityType: EntityType;
  entityId: SuspensionRequestTargetIds;
};

export function CustomChatCreateSuspensionDialog({
  trigger,
  entityType,
  entityId,
}: CustomChatCreateSuspensionDialogProps) {
  const [open, setOpen] = React.useState(false);
  const toast = useToast();
  const messages = useMessages();
  const tEntityMessages = messages.suspension[entityType];
  const tResons = messages.suspension['create-dialog-reasons'];

  const reasons = [
    { value: 'copyright-infringement', label: tResons['copyright-infringement'] },
    { value: 'wrong-or-outdated', label: tResons['wrong-or-outdated'] },
    { value: 'insufficient-citations', label: tResons['insufficient-citations'] },
    { value: 'discrimination', label: tResons['discrimination'] },
    { value: 'personal-data', label: tResons['personal-data'] },
    { value: 'violence', label: tResons['violence'] },
    { value: 'sexualized-content', label: tResons['sexualized-content'] },
    { value: 'other', label: tResons['other'] },
  ] as const;

  const form = useForm<z.infer<typeof suspensionFormValuesSchema>>({
    resolver: zodResolver(suspensionFormValuesSchema),
    mode: 'onChange',
    defaultValues: {
      reason: '',
      description: '',
    },
  });

  async function onSubmit(data: z.infer<typeof suspensionFormValuesSchema>) {
    console.log(data);

    const result = await createSuspensionRequestAction({
      ...entityId,
      reason: data.reason,
      description: data.description,
    });

    if (result.success) {
      toast.success(tEntityMessages['create-dialog-success-message']);
    } else {
      toast.error(result.error.message);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      form.reset();
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tEntityMessages['create-dialog-title']}</AlertDialogTitle>
          <AlertDialogDescription className="sr-only">
            {messages.suspension['create-dialog-description']}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form id="create-suspension-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="reason"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="suspension-reason" required>
                    {messages.suspension['create-dialog-reason-label']}
                  </FieldLabel>
                  <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Grund auswählen" />
                      <SelectContent>
                        <SelectGroup>
                          {reasons.map((reason) => (
                            <SelectItem key={reason.value} value={reason.value}>
                              {reason.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </SelectTrigger>
                  </Select>
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="suspension-description">
                    {messages.suspension['create-dialog-description-label']}
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="suspension-description"
                    maxLength={500}
                    className="min-h-35 max-h-60 resize-none"
                  />
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <AlertDialogFooter>
          <AlertDialogCancel>
            {messages.suspension['create-dialog-cancel-button-text']}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="default"
            type="submit"
            form="create-suspension-form"
            disabled={!form.formState.isValid}
          >
            {tEntityMessages['create-dialog-confirm-button-text']}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
