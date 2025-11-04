'use client';

import { useState, useEffect } from 'react';
import { getFederalStateIdsAction, getTemplateByIdAction } from './actions';
import { TemplateModel, TemplateTypes } from '@shared/models/templates';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@ui/components/Button';
import { FormFieldCheckbox } from '@ui/components/form/FormFieldCheckbox';

export type TemplateDetailViewProps = {
  templateType: TemplateTypes;
  templateId: string;
};

const formSchema = z.array(z.object({ federalStateId: z.string(), isSelected: z.boolean() }));
type FormData = z.infer<typeof formSchema>;

export default function TemplateDetailView(props: TemplateDetailViewProps) {
  const { templateType, templateId } = props;
  const [template, setTemplate] = useState<TemplateModel | null>(null);
  const [formData, setFormData] = useState<FormData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormData>();
  const { control } = form;

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [template, federalStateIds] = await Promise.all([
          getTemplateByIdAction(templateType, templateId),
          getFederalStateIdsAction(),
        ]);

        setTemplate(template);
        setFormData(federalStateIds.map((id) => ({ federalStateId: id.id, isSelected: false })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [templateType, templateId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <div>
        <div>
          Template Detail View for {props.templateType} - {props.templateId}
        </div>
        {template && (
          <>
            <div>{template.id}</div>
            <div>{template.originalId}</div>
            <div>{template.type}</div>
            <div>{template.name}</div>
            <div>{template.createdAt.toLocaleString()}</div>
            <div>{template.isDeleted.toString()}</div>
          </>
        )}
      </div>
      <div>
        Mappings
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {formData.map((data, index) => (
            <FormFieldCheckbox
              control={control}
              key={data.federalStateId}
              label={data.federalStateId}
              name={`${index}.isSelected`}
              variant="compact"
            />
          ))}

          <Button type="submit">Speichern</Button>
        </form>
      </div>
    </div>
  );
}
