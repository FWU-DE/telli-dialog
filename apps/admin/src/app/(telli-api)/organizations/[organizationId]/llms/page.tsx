import { LargeLanguageModelListView } from './LargeLanguageModelListView';

export default async function LargeLanguageModelsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  return <LargeLanguageModelListView organizationId={organizationId} />;
}
