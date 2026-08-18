import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { getToolCallCostByName } from '@shared/tool-call-costs/tool-call-cost-service';
import { AdminAppSidebar } from '../AdminAppSidebar';
import ToolCallCostListView from './ToolCallCostListView';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten.';
}

export default async function ToolCallCostsPage() {
  let initialToolCallCost = null;
  let initialLoadError: string | null = null;

  try {
    initialToolCallCost = await getToolCallCostByName('web_search');
  } catch (error) {
    initialLoadError = getErrorMessage(error);
  }

  return (
    <TwoColumnLayout
      sidebar={<AdminAppSidebar />}
      page={
        <ToolCallCostListView
          initialToolCallCost={initialToolCallCost}
          initialLoadError={initialLoadError}
        />
      }
    />
  );
}
