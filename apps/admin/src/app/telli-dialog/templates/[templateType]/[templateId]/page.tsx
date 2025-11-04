import TemplateDetailView from './TemplateDetailView';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
}: {
  params: Promise<{ templateType: string; templateId: string }>;
}) {
  const { templateType, templateId } = await params;

  return <TemplateDetailView templateType={templateType} templateId={templateId} />;
}
