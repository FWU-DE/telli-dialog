'use client';

import { useState, useEffect } from 'react';
import {
  getFederalStatesWithMappingsAction,
  getTemplateByIdAction,
  updateTemplateMappingsAction,
} from './actions';
import {
  TemplateModel,
  TemplateToFederalStateMapping,
  TemplateTypes,
} from '@shared/models/templates';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@ui/components/Button';
import { FormFieldCheckbox } from '@ui/components/form/FormFieldCheckbox';
import { toast } from 'sonner';
import { TemplateInfoCard } from './TemplateInfoCard';

export type TemplateDetailViewProps = {
  templateType: TemplateTypes;
  templateId: string;
};

export default function TemplateDetailView(props: TemplateDetailViewProps) {
  const { templateType, templateId } = props;
  const [template, setTemplate] = useState<TemplateModel | null>(null);
  const [formData, setFormData] = useState<TemplateToFederalStateMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<{ mappings: TemplateToFederalStateMapping[] }>();
  const { control, reset } = form;

  const { fields } = useFieldArray({
    control,
    name: 'mappings',
  });

  const handleSubmit = ({ mappings }: { mappings: TemplateToFederalStateMapping[] }) => {
    try {
      updateTemplateMappingsAction(templateType, templateId, mappings);
      toast.success('Template-Zuordnungen erfolgreich aktualisiert.');
    } catch {
      toast.error('Fehler beim Aktualisieren der Template-Zuordnungen.');
    }
  };

  useEffect(() => {
    reset({ mappings: formData });
  }, [formData, reset]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [template, federalStateMappings] = await Promise.all([
          getTemplateByIdAction(templateType, templateId),
          getFederalStatesWithMappingsAction(templateType, templateId),
        ]);

        setTemplate(template);
        setFormData(federalStateMappings);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
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
      <div>{template && <TemplateInfoCard template={template} />}</div>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {fields.map((field, index) => {
          return (
            <FormFieldCheckbox
              control={control}
              key={field.id}
              label={field.federalStateId}
              name={`mappings.${index}.isMapped`}
              variant="compact"
            />
          );
        })}
        <Button type="submit">Speichern</Button>
      </form>
    </div>
  );
}
