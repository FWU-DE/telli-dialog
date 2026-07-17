import { cacheLife } from 'next/cache';
import { generateTextWithBilling } from '@ais-chat/ai-core';
import { dbGetCharacterById } from '@shared/db/functions/character';
import { dbGetLearningScenarioById } from '@shared/db/functions/learning-scenario';
import { getUserAndContextByUserId } from '@/auth/utils';
import { getModelAndApiKeyWithResult, getStrongAuxiliaryModel } from '@/app/api/utils/utils';
import { constructCharacterLanguageSystemPrompt } from '@/app/api/character/system-prompt';
import { constructLearningScenarioLanguageSystemPrompt } from '@/app/api/learning-scenario/system-prompt';
import { LlmModelSelectModel } from '@shared/db/schema';

const DEFAULT_LOCALE = 'de';
const SUPPORTED_LOCALES = new Set(['de', 'en', 'fr', 'it', 'ar']);
const FILTER_LANGUAGE_TO_LOCALE: Record<string, string> = {
  german: 'de',
  english: 'en',
  french: 'fr',
  italian: 'it',
};

export async function resolveSharingLocale(uiLink: string): Promise<string> {
  const route = parseSharingRoute(uiLink);

  if (route === undefined) {
    return DEFAULT_LOCALE;
  }

  return resolveSharingLocaleByRoute({ routeType: route.type, entityId: route.entityId });
}

async function resolveSharingLocaleByRoute({
  routeType,
  entityId,
}: {
  routeType: 'character' | 'learning-scenario';
  entityId: string;
}): Promise<string> {
  'use cache';
  cacheLife({
    expire: 60 * 60 * 24,
    revalidate: 60 * 60 * 23,
  });

  if (routeType === 'character') {
    const character = await dbGetCharacterById({ characterId: entityId });

    if (character === undefined) {
      return DEFAULT_LOCALE;
    }

    const localeFromFilterLanguage = await getLocaleFromFilterLanguages(
      character.filterGroup?.languages,
    );
    // TODO: Remove logs
    console.log('Locale from filter languages:', localeFromFilterLanguage);
    if (localeFromFilterLanguage !== null) {
      return localeFromFilterLanguage;
    }

    const teacherUserAndContext = await getUserAndContextByUserId({ userId: character.userId });
    const auxiliaryModel = await getStrongAuxiliaryModel(teacherUserAndContext.federalState.id);
    const [error, auxiliaryModelAndApiKey] = await getModelAndApiKeyWithResult({
      modelId: auxiliaryModel.id,
      federalStateId: teacherUserAndContext.federalState.id,
    });

    if (error !== null) {
      return DEFAULT_LOCALE;
    }

    const systemPrompt = constructCharacterLanguageSystemPrompt({
      character,
    });

    return getLocale(auxiliaryModelAndApiKey, systemPrompt);
  }

  if (routeType === 'learning-scenario') {
    const learningScenario = await dbGetLearningScenarioById({
      learningScenarioId: entityId,
    });

    if (learningScenario === undefined) {
      return DEFAULT_LOCALE;
    }

    const localeFromFilterLanguage = await getLocaleFromFilterLanguages(
      learningScenario.filterGroup?.languages,
    );
    if (localeFromFilterLanguage !== null) {
      return localeFromFilterLanguage;
    }

    const teacherUserAndContext = await getUserAndContextByUserId({
      userId: learningScenario.userId,
    });
    const [error, modelAndApiKey] = await getModelAndApiKeyWithResult({
      modelId: learningScenario.modelId,
      federalStateId: teacherUserAndContext.federalState.id,
    });

    if (error !== null) {
      return DEFAULT_LOCALE;
    }

    const systemPrompt = constructLearningScenarioLanguageSystemPrompt({
      learningScenario,
    });

    return getLocale(modelAndApiKey, systemPrompt);
  }

  return DEFAULT_LOCALE;
}

async function getLocaleFromFilterLanguages(
  languages: string[] | undefined,
): Promise<string | null> {
  'use cache';
  cacheLife({
    expire: 60 * 60 * 24,
    revalidate: 60 * 60 * 23,
  });
  console.log('Filter languages:', languages);

  if (languages === undefined || languages.length !== 1) {
    return null;
  }

  const selectedLanguage = languages[0];
  if (selectedLanguage === undefined) {
    return null;
  }

  return FILTER_LANGUAGE_TO_LOCALE[selectedLanguage] ?? null;
}

async function getLocale(
  auxiliaryModelAndApiKey: { model: LlmModelSelectModel; apiKeyId: string },
  systemPrompt: string,
): Promise<string> {
  'use cache';
  cacheLife({
    expire: 60 * 60 * 24,
    revalidate: 60 * 60 * 23,
  });
  try {
    const { text } = await generateTextWithBilling(
      auxiliaryModelAndApiKey.model.id,
      [
        {
          role: 'system',
          content:
            'Determine the language in which the following assistant will respond to messages. Respond exclusively with one of the following language codes: de, en, fr, it, ar. If the language is not clear, respond with de.',
        },
        {
          role: 'system',
          content: systemPrompt,
        },
      ],
      auxiliaryModelAndApiKey.apiKeyId,
    );
    console.log('Detected language code:', text);

    return normalizeLocale(text);
  } catch {
    return DEFAULT_LOCALE;
  }
}

function parseSharingRoute(
  uiLink: string,
):
  | { type: 'character'; entityId: string }
  | { type: 'learning-scenario'; entityId: string }
  | undefined {
  const pathname = uiLink.split('?')[0] ?? uiLink;

  const characterShareMatch = pathname.match(/^\/(?:ua\/)?characters\/([^/]+)\/dialog$/);
  if (characterShareMatch?.[1]) {
    return { type: 'character', entityId: characterShareMatch[1] };
  }

  const learningScenarioShareMatch = pathname.match(
    /^\/(?:ua\/)?learning-scenarios\/([^/]+)\/dialog$/,
  );
  if (learningScenarioShareMatch?.[1]) {
    return { type: 'learning-scenario', entityId: learningScenarioShareMatch[1] };
  }

  const characterEditorShareMatch = pathname.match(/^\/characters\/editor\/([^/]+)\/share$/);
  if (characterEditorShareMatch?.[1]) {
    return { type: 'character', entityId: characterEditorShareMatch[1] };
  }

  const learningScenarioEditorShareMatch = pathname.match(
    /^\/learning-scenarios\/editor\/([^/]+)\/share$/,
  );
  if (learningScenarioEditorShareMatch?.[1]) {
    return { type: 'learning-scenario', entityId: learningScenarioEditorShareMatch[1] };
  }

  return undefined;
}

function normalizeLocale(text: string): string {
  const normalized = text.trim().toLowerCase();

  if (SUPPORTED_LOCALES.has(normalized)) {
    return normalized;
  }

  if (normalized.includes('de')) return 'de';
  if (normalized.includes('en')) return 'en';
  if (normalized.includes('fr')) return 'fr';
  if (normalized.includes('it')) return 'it';
  if (normalized.includes('ar')) return 'ar';

  if (normalized.includes('german') || normalized.includes('deutsch')) return 'de';
  if (normalized.includes('english') || normalized.includes('englisch')) return 'en';
  if (normalized.includes('french') || normalized.includes('französisch')) return 'fr';
  if (normalized.includes('italian') || normalized.includes('italienisch')) return 'it';
  if (normalized.includes('arabic') || normalized.includes('arabisch')) return 'ar';

  return DEFAULT_LOCALE;
}
