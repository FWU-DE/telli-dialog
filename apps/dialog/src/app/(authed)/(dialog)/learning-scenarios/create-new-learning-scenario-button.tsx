import { cn } from '@/utils/tailwind';

import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/common/toast';
import { useRouter } from 'next/navigation';
import { createNewLearningScenarioAction } from './actions';
import { getDefaultModel } from '@shared/llm-models/llm-model-service';
import { Button } from '@ui/components/Button';
import { PlusIcon } from '@phosphor-icons/react';

export function CreateNewLearningScenarioButton() {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('learning-scenarios');

  const { models } = useLlmModels();

  const maybeDefaultModelId = getDefaultModel(models)?.id;

  async function handleNewLearningScenario() {
    if (!maybeDefaultModelId) {
      throw new Error('No default model found');
    }
    const scenario = await createNewLearningScenarioAction({ modelId: maybeDefaultModelId });
    if (scenario.success) {
      router.push(`/learning-scenarios/editor/${scenario.value.id}?create=true`);
    } else {
      toast.error(t('toasts.create-toast-error'));
    }
  }

  return (
    <Button
      type="button"
      onClick={handleNewLearningScenario}
      className={cn(buttonPrimaryClassName)}
    >
      <PlusIcon className="size-5" />
      {t('form.button-create')}
    </Button>
  );
}
