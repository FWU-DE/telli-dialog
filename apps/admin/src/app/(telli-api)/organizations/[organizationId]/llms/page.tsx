import { LargeLanguageModelListView } from './LargeLanguageModelListView';
import { getLargeLanguageModelsAction } from './actions';

export default async function LargeLanguageModelsPage(
  props: PageProps<'/organizations/[organizationId]/llms'>,
) {
  const { organizationId } = await props.params;
  const initialData = await getLargeLanguageModelsAction(organizationId);
  return <LargeLanguageModelListView organizationId={organizationId} initialData={initialData} />;
}
