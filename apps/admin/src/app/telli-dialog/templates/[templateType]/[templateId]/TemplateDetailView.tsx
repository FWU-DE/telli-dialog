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

export type TemplateDetailViewProps = {
  templateType: TemplateTypes;
  templateId: string;
};

// Component that handles the form with proper initialization
function TemplateForm({
  formData,
  onSubmit,
}: {
  formData: TemplateToFederalStateMapping;
  onSubmit: (data: TemplateToFederalStateMapping) => void;
}) {
  const form = useForm<{ mappings: TemplateToFederalStateMapping }>({
    defaultValues: { mappings: formData },
  });
  const { control } = form;

  const { fields } = useFieldArray({
    control,
    name: 'mappings',
  });

  console.log('TemplateForm initialized with formData:', formData);
  console.log('Form default values:', form.getValues());
  console.log('Fields from useFieldArray:', fields);

  const handleSubmit = (data: { mappings: TemplateToFederalStateMapping }) => {
    onSubmit(data.mappings);
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {fields.map((field, index) => {
        const fieldName = `mappings.${index}.isMapped` as const;
        console.log(`Checkbox ${index} for ${formData[index]?.federalStateId}:`, {
          isMapped: formData[index]?.isMapped,
          path: fieldName,
          fieldId: field.id,
        });
        return (
          <FormFieldCheckbox
            control={control}
            key={field.id}
            label={`${formData[index]?.federalStateId} (${formData[index]?.isMapped ? 'checked' : 'unchecked'})`}
            name={fieldName}
            variant="compact"
          />
        );
      })}
      <Button type="submit">Speichern</Button>
    </form>
  );
}

export default function TemplateDetailView(props: TemplateDetailViewProps) {
  const { templateType, templateId } = props;
  const [template, setTemplate] = useState<TemplateModel | null>(null);
  const [formData, setFormData] = useState<TemplateToFederalStateMapping>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (data: TemplateToFederalStateMapping) => {
    try {
      updateTemplateMappingsAction(templateType, templateId, data);
    } catch {
      toast.error('Fehler beim Aktualisieren der Template-Zuordnungen.');
    }
  };

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
        // Ensure boolean values are properly typed
        const processedMappings = federalStateMappings.map((mapping) => ({
          ...mapping,
          isMapped: Boolean(mapping.isMapped),
        }));
        console.log('Raw federalStateMappings:', federalStateMappings);
        console.log('Processed mappings:', processedMappings);
        setFormData(processedMappings);
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
        {formData.length > 0 && (
          <TemplateForm key={`form-${templateId}`} formData={formData} onSubmit={onSubmit} />
        )}
      </div>
    </div>
  );
}
