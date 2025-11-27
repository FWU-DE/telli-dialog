import { getLargeLanguageModelsAction } from '../actions';
import { LargeLanguageModelDetailView } from './LargeLanguageModelDetailView';

export const dynamic = 'force-dynamic';

export default async function Page(
  props: PageProps<'/organizations/[organizationId]/llms/[llmId]'>,
) {
  const { organizationId, llmId } = await props.params;

  if (llmId === 'new') {
    // Create new LLM
    return <LargeLanguageModelDetailView organizationId={organizationId} mode="create" />;
  }

  // Edit existing LLM
  const models = await getLargeLanguageModelsAction(organizationId);
  const model = models.find((m) => m.id === llmId);

  if (!model) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">Modell nicht gefunden</h1>
        <p className="text-gray-600 mt-2">
          Das angeforderte Sprachmodell konnte nicht gefunden werden.
        </p>
      </div>
    );
  }

  return <LargeLanguageModelDetailView organizationId={organizationId} model={model} mode="edit" />;
}
