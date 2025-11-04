'use client';

import { useEffect, useState, useTransition } from 'react';
import { getTemplateByIdAction } from './actions';
import { TemplateModel } from '@shared/models/templates';

export type TemplateDetailViewProps = {
  templateType: string;
  templateId: string;
};

export default function TemplateDetailView(props: TemplateDetailViewProps) {
  const { templateType, templateId } = props;
  const [template, setTemplate] = useState<TemplateModel | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadTemplate();
  });

  const loadTemplate = async () => {
    startTransition(async () => {
      const template = await getTemplateByIdAction(templateType, templateId);
      setTemplate(template);
    });
  };

  return (
    <div>
      <div>
        <div>
          Template Detail View for {props.templateType} - {props.templateId}
        </div>
        <div>{template?.id}</div>
        <div>{template?.originalId}</div>
        <div>{template?.type}</div>
        <div>{template?.name}</div>
        <div>{template?.createdAt.toLocaleString()}</div>
        <div>{template?.isDeleted}</div>
      </div>
    </div>
  );
}
