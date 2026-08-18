import { getProviderKeysAction } from './actions';
import { ProviderKeyListView } from './ProviderKeyListView';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function ProviderKeysPage(
  props: PageProps<'/organizations/[organizationId]/provider-keys'>,
) {
  const { organizationId } = await props.params;
  const result = await getProviderKeysAction(organizationId);
  if (!result.success) throw new Error(result.error.message);
  return <ProviderKeyListView organizationId={organizationId} providerKeys={result.value} />;
}
