import TemplateDetailView from './TemplateDetailView';
import { isTemplateType } from '@shared/templates/template';

export const dynamic = 'force-dynamic';

export default async function Page(
  props: PageProps<'/telli-dialog/templates/[templateType]/[templateId]'>,
) {
  const { templateType, templateId } = await props.params;

  if (!isTemplateType(templateType)) {
    throw new Error('Invalid template type');
  }

  return <TemplateDetailView templateType={templateType} templateId={templateId} />;
}
