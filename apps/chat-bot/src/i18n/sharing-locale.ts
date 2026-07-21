import { cacheLife } from 'next/cache';
import { generateTextWithBilling } from '@ais-chat/ai-core';
import { dbGetCharacterById } from '@shared/db/functions/character';
import { dbGetLearningScenarioById } from '@shared/db/functions/learning-scenario';
import { dbUpdateCharacterFilterGroup } from '@shared/db/functions/character';
import { dbUpdateLearningScenarioFilterGroup } from '@shared/db/functions/learning-scenario';
import { getUserAndContextByUserId } from '@/auth/utils';
import { getModelAndApiKeyWithResult, getStrongAuxiliaryModel } from '@/app/api/utils/utils';
import { constructCharacterLanguageSystemPrompt } from '@/app/api/character/system-prompt';
import { constructLearningScenarioLanguageSystemPrompt } from '@/app/api/learning-scenario/system-prompt';
import type { LlmModelSelectModel, filterGroup } from '@shared/db/schema';
import {
  DEFAULT_LOCALE,
  FILTER_LANGUAGE_TO_LOCALE,
  LOCALE_TO_FILTER_LANGUAGE,
  SUPPORTED_LOCALES,
} from './locales';

/**
 * Resolves the locale for a shared chat entity (character or learning scenario).
 * Parses the UI link to determine the entity type and ID, then resolves the locale.
 */
export async function resolveSharingLocale(uiLink: string): Promise<string> {
  const route = parseSharingRoute(uiLink);

  if (route === undefined) {
    return DEFAULT_LOCALE;
  }

  return resolveSharingLocaleByRoute({ routeType: route.type, entityId: route.entityId });
}

/**
 * Resolves the locale for a character or learning scenario.
 * Priority: filter language > LLM-determined language > default locale.
 */
async function resolveSharingLocaleByRoute({
  routeType,
  entityId,
}: {
  routeType: 'character' | 'learning-scenario';
  entityId: string;
}): Promise<string> {
  if (routeType === 'character') {
    const character = await dbGetCharacterById({ characterId: entityId });

    if (character === undefined) {
      return DEFAULT_LOCALE;
    }

    const localeFromFilterLanguage = getLocaleFromFilterLanguages(character.filterGroup?.languages);
    if (localeFromFilterLanguage !== null) {
      return localeFromFilterLanguage;
    }

    const teacherUserAndContext = await getUserAndContextByUserId({ userId: character.userId });
    const sharedPageLocaleDetectionEnabled =
      teacherUserAndContext.federalState.featureToggles.isSharedPageLocaleDetectionEnabled ?? true;
    if (!sharedPageLocaleDetectionEnabled) {
      return DEFAULT_LOCALE;
    }

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

    const locale = await getLocale(auxiliaryModelAndApiKey, systemPrompt);
    if (locale === null) {
      return DEFAULT_LOCALE;
    }

    await persistDetectedLanguage({
      entityType: 'character',
      entityId: character.id,
      locale,
      existingFilterGroup: character.filterGroup,
    });

    return locale;
  }

  if (routeType === 'learning-scenario') {
    const learningScenario = await dbGetLearningScenarioById({
      learningScenarioId: entityId,
    });

    if (learningScenario === undefined) {
      return DEFAULT_LOCALE;
    }

    const localeFromFilterLanguage = getLocaleFromFilterLanguages(
      learningScenario.filterGroup?.languages,
    );
    if (localeFromFilterLanguage !== null) {
      return localeFromFilterLanguage;
    }

    const teacherUserAndContext = await getUserAndContextByUserId({
      userId: learningScenario.userId,
    });
    const sharedPageLocaleDetectionEnabled =
      teacherUserAndContext.federalState.featureToggles.isSharedPageLocaleDetectionEnabled ?? true;
    if (!sharedPageLocaleDetectionEnabled) {
      return DEFAULT_LOCALE;
    }

    const auxiliaryModel = await getStrongAuxiliaryModel(teacherUserAndContext.federalState.id);
    const [error, auxiliaryModelAndApiKey] = await getModelAndApiKeyWithResult({
      modelId: auxiliaryModel.id,
      federalStateId: teacherUserAndContext.federalState.id,
    });

    if (error !== null) {
      return DEFAULT_LOCALE;
    }

    const systemPrompt = constructLearningScenarioLanguageSystemPrompt({
      learningScenario,
    });

    const locale = await getLocale(auxiliaryModelAndApiKey, systemPrompt);
    if (locale === null) {
      return DEFAULT_LOCALE;
    }

    await persistDetectedLanguage({
      entityType: 'learning-scenario',
      entityId: learningScenario.id,
      locale,
      existingFilterGroup: learningScenario.filterGroup,
    });

    return locale;
  }

  return DEFAULT_LOCALE;
}

/**
 * Checks if a single filter language is explicitly set.
 * Returns the mapped locale for supported languages, or null to use LLM detection.
 */
function getLocaleFromFilterLanguages(languages: string[] | undefined): string | null {
  if (languages === undefined || languages.length !== 1) {
    return null;
  }

  const selectedLanguage = languages[0];
  if (selectedLanguage === undefined) {
    return null;
  }

  // We only ship a subset of locales. For unsupported language filters,
  // use the default locale deterministically instead of model-based guessing.
  return FILTER_LANGUAGE_TO_LOCALE[selectedLanguage] ?? DEFAULT_LOCALE;
}

/**
 * Calls the LLM to determine which language the entity's content is in.
 * Results are cached for 24 hours based on the systemPrompt content.
 */
async function getLocale(
  auxiliaryModelAndApiKey: { model: LlmModelSelectModel; apiKeyId: string },
  systemPrompt: string,
): Promise<string | null> {
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
    return normalizeLocale(text);
  } catch {
    return null;
  }
}

/**
 * Persists a locale detected by the LLM back to the entity's filterGroup.languages.
 * No-ops if the locale cannot be mapped to a known Language or is already in the list.
 * Errors are caught so locale resolution is never blocked by a write failure.
 */
async function persistDetectedLanguage({
  entityType,
  entityId,
  locale,
  existingFilterGroup,
}: {
  entityType: 'character' | 'learning-scenario';
  entityId: string;
  locale: string;
  existingFilterGroup: filterGroup | undefined;
}): Promise<void> {
  const detectedLanguage = LOCALE_TO_FILTER_LANGUAGE[locale];
  if (detectedLanguage === undefined) {
    return;
  }

  const currentLanguages = existingFilterGroup?.languages ?? [];
  if (currentLanguages.includes(detectedLanguage)) {
    return;
  }

  const updatedFilterGroup: filterGroup = {
    school_types: existingFilterGroup?.school_types ?? [],
    grade_ranges: existingFilterGroup?.grade_ranges ?? [],
    subjects: existingFilterGroup?.subjects ?? [],
    categories: existingFilterGroup?.categories ?? [],
    federal_states: existingFilterGroup?.federal_states ?? [],
    languages: [...currentLanguages, detectedLanguage],
  };

  try {
    if (entityType === 'character') {
      await dbUpdateCharacterFilterGroup({
        characterId: entityId,
        filterGroup: updatedFilterGroup,
      });
    } else {
      await dbUpdateLearningScenarioFilterGroup({
        learningScenarioId: entityId,
        filterGroup: updatedFilterGroup,
      });
    }
  } catch {
    // write failure must not break locale resolution
  }
}

/**
 * Parses a sharing URL to extract the entity type and ID.
 * Supports multiple URL patterns: dialog views and editor share views.
 */
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
