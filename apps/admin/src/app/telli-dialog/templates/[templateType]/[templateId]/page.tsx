import TemplateDetailView from './TemplateDetailView';
import { isTemplateType } from '@shared/models/templates';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
}: {
  params: Promise<{ templateType: string; templateId: string }>;
}) {
  const { templateType, templateId } = await params;

  if (!isTemplateType(templateType)) {
    throw new Error('Invalid template type');
  }

  return <TemplateDetailView templateType={templateType} templateId={templateId} />;
}
