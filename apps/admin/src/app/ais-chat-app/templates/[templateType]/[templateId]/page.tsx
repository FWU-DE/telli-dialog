import TemplateDetailView from './TemplateDetailView';
import { isTemplateType } from '@shared/templates/template';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Page(
  props: PageProps<'/ais-chat-app/templates/[templateType]/[templateId]'>,
) {
  const { templateType, templateId } = await props.params;

  if (!isTemplateType(templateType)) {
    throw new Error('Invalid template type');
  }

  return <TemplateDetailView templateType={templateType} templateId={templateId} />;
}
