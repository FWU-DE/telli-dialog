import { LargeLanguageModelListView } from './LargeLanguageModelListView';
import { getLargeLanguageModelsAction } from './actions';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function LargeLanguageModelsPage(
  props: PageProps<'/organizations/[organizationId]/llms'>,
) {
  const { organizationId } = await props.params;
  const initialData = await getLargeLanguageModelsAction(organizationId);
  return <LargeLanguageModelListView organizationId={organizationId} initialData={initialData} />;
}
