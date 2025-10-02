import { LargeLanguageModelListView } from './LargeLanguageModelListView';

export const LLMS_ROUTE = '/llms';
export default async function LargeLanguageModelsPage() {
  return <LargeLanguageModelListView />;
}
