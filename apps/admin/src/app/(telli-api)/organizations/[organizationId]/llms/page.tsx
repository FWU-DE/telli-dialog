import { LargeLanguageModelListView } from './LargeLanguageModelListView';
import { getLargeLanguageModelsAction } from './actions';

export default async function LargeLanguageModelsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const initialData = await getLargeLanguageModelsAction(organizationId);
  return <LargeLanguageModelListView organizationId={organizationId} initialData={initialData} />;
}
