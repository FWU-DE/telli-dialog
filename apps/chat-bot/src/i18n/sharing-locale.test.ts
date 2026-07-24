import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cacheLifeMock: vi.fn(),
  generateTextWithBillingMock: vi.fn(),
  dbGetCharacterByIdMock: vi.fn(),
  dbUpdateCharacterFilterGroupMock: vi.fn(),
  dbGetLearningScenarioByIdMock: vi.fn(),
  dbUpdateLearningScenarioFilterGroupMock: vi.fn(),
  getUserAndContextByUserIdMock: vi.fn(),
  getModelAndApiKeyWithResultMock: vi.fn(),
  getStrongAuxiliaryModelMock: vi.fn(),
  constructCharacterLanguageSystemPromptMock: vi.fn(),
  constructLearningScenarioLanguageSystemPromptMock: vi.fn(),
}));

vi.mock('next/cache', () => ({
  cacheLife: mocks.cacheLifeMock,
}));

vi.mock('@ais-chat/ai-core', () => ({
  generateTextWithBilling: mocks.generateTextWithBillingMock,
}));

vi.mock('@shared/db/functions/character', () => ({
  dbGetCharacterById: mocks.dbGetCharacterByIdMock,
  dbUpdateCharacterFilterGroup: mocks.dbUpdateCharacterFilterGroupMock,
}));

vi.mock('@shared/db/functions/learning-scenario', () => ({
  dbGetLearningScenarioById: mocks.dbGetLearningScenarioByIdMock,
  dbUpdateLearningScenarioFilterGroup: mocks.dbUpdateLearningScenarioFilterGroupMock,
}));

vi.mock('@/auth/utils', () => ({
  getUserAndContextByUserId: mocks.getUserAndContextByUserIdMock,
}));

vi.mock('@/app/api/utils/utils', () => ({
  getModelAndApiKeyWithResult: mocks.getModelAndApiKeyWithResultMock,
  getStrongAuxiliaryModel: mocks.getStrongAuxiliaryModelMock,
}));

vi.mock('@/app/api/character/system-prompt', () => ({
  constructCharacterLanguageSystemPrompt: mocks.constructCharacterLanguageSystemPromptMock,
}));

vi.mock('@/app/api/learning-scenario/system-prompt', () => ({
  constructLearningScenarioLanguageSystemPrompt:
    mocks.constructLearningScenarioLanguageSystemPromptMock,
}));

const teacherUserAndContext = {
  federalState: {
    id: 'federal-state-1',
    featureToggles: {
      isSharedPageLocaleDetectionEnabled: true,
    },
  },
};

const auxiliaryModel = {
  id: 'aux-model-1',
};

const modelAndApiKey = {
  model: { id: 'aux-model-1' },
  apiKeyId: 'api-key-1',
};

beforeEach(() => {
  vi.clearAllMocks();

  mocks.dbGetCharacterByIdMock.mockResolvedValue({
    id: 'character-1',
    userId: 'teacher-1',
    filterGroup: undefined,
  });
  mocks.dbGetLearningScenarioByIdMock.mockResolvedValue({
    id: 'scenario-1',
    userId: 'teacher-1',
    filterGroup: undefined,
  });
  mocks.getUserAndContextByUserIdMock.mockResolvedValue(teacherUserAndContext);
  mocks.getStrongAuxiliaryModelMock.mockResolvedValue(auxiliaryModel);
  mocks.getModelAndApiKeyWithResultMock.mockResolvedValue([null, modelAndApiKey]);
  mocks.constructCharacterLanguageSystemPromptMock.mockReturnValue('character-system-prompt');
  mocks.constructLearningScenarioLanguageSystemPromptMock.mockReturnValue(
    'learning-scenario-system-prompt',
  );
  mocks.generateTextWithBillingMock.mockResolvedValue({ text: 'de' });
  mocks.dbUpdateCharacterFilterGroupMock.mockResolvedValue(undefined);
  mocks.dbUpdateLearningScenarioFilterGroupMock.mockResolvedValue(undefined);
});

describe('resolveSharingLocale', () => {
  it('returns default locale for unknown routes', async () => {
    const { resolveSharingLocale } = await import('./sharing-locale');

    const locale = await resolveSharingLocale('/not-a-shared-route');

    expect(locale).toBe('de');
    expect(mocks.dbGetCharacterByIdMock).not.toHaveBeenCalled();
    expect(mocks.dbGetLearningScenarioByIdMock).not.toHaveBeenCalled();
  });

  it('returns mapped locale from character single filter language and skips detection', async () => {
    const { resolveSharingLocale } = await import('./sharing-locale');
    mocks.dbGetCharacterByIdMock.mockResolvedValue({
      id: 'character-1',
      userId: 'teacher-1',
      filterGroup: {
        school_types: [],
        grade_ranges: [],
        subjects: [],
        categories: [],
        federal_states: [],
        languages: ['english'],
      },
    });

    const locale = await resolveSharingLocale('/ua/characters/character-1/dialog?inviteCode=abc');

    expect(locale).toBe('en');
    expect(mocks.getUserAndContextByUserIdMock).not.toHaveBeenCalled();
    expect(mocks.generateTextWithBillingMock).not.toHaveBeenCalled();
  });

  it('returns default locale for unsupported character single filter language and skips detection', async () => {
    const { resolveSharingLocale } = await import('./sharing-locale');
    mocks.dbGetCharacterByIdMock.mockResolvedValue({
      id: 'character-1',
      userId: 'teacher-1',
      filterGroup: {
        school_types: [],
        grade_ranges: [],
        subjects: [],
        categories: [],
        federal_states: [],
        languages: ['spanish'],
      },
    });

    const locale = await resolveSharingLocale('/ua/characters/character-1/dialog?inviteCode=abc');

    expect(locale).toBe('de');
    expect(mocks.getUserAndContextByUserIdMock).not.toHaveBeenCalled();
    expect(mocks.generateTextWithBillingMock).not.toHaveBeenCalled();
  });

  it('returns default locale when character locale detection toggle is disabled', async () => {
    const { resolveSharingLocale } = await import('./sharing-locale');
    mocks.getUserAndContextByUserIdMock.mockResolvedValue({
      federalState: {
        id: 'federal-state-1',
        featureToggles: {
          isSharedPageLocaleDetectionEnabled: false,
        },
      },
    });

    const locale = await resolveSharingLocale('/ua/characters/character-1/dialog?inviteCode=abc');

    expect(locale).toBe('de');
    expect(mocks.getStrongAuxiliaryModelMock).not.toHaveBeenCalled();
    expect(mocks.getModelAndApiKeyWithResultMock).not.toHaveBeenCalled();
    expect(mocks.generateTextWithBillingMock).not.toHaveBeenCalled();
  });

  it('treats undefined character locale detection toggle as enabled and persists detected language', async () => {
    const { resolveSharingLocale } = await import('./sharing-locale');
    mocks.getUserAndContextByUserIdMock.mockResolvedValue({
      federalState: {
        id: 'federal-state-1',
        featureToggles: {},
      },
    });
    mocks.generateTextWithBillingMock.mockResolvedValue({ text: 'english' });

    const locale = await resolveSharingLocale('/characters/editor/character-1/share');

    expect(locale).toBe('en');
    expect(mocks.getStrongAuxiliaryModelMock).toHaveBeenCalledWith('federal-state-1');
    expect(mocks.getModelAndApiKeyWithResultMock).toHaveBeenCalledWith({
      modelId: 'aux-model-1',
      federalStateId: 'federal-state-1',
    });
    expect(mocks.dbUpdateCharacterFilterGroupMock).toHaveBeenCalledWith({
      characterId: 'character-1',
      filterGroup: {
        school_types: [],
        grade_ranges: [],
        subjects: [],
        categories: [],
        federal_states: [],
        languages: ['english'],
      },
    });
  });

  it('falls back to default locale when model/api-key lookup fails for character', async () => {
    const { resolveSharingLocale } = await import('./sharing-locale');
    mocks.getModelAndApiKeyWithResultMock.mockResolvedValue([new Error('missing key'), null]);

    const locale = await resolveSharingLocale('/ua/characters/character-1/dialog?inviteCode=abc');

    expect(locale).toBe('de');
    expect(mocks.generateTextWithBillingMock).not.toHaveBeenCalled();
  });

  it('returns detected locale even when character filter-group update fails', async () => {
    const { resolveSharingLocale } = await import('./sharing-locale');
    mocks.generateTextWithBillingMock.mockResolvedValue({ text: 'fr' });
    mocks.dbUpdateCharacterFilterGroupMock.mockRejectedValue(new Error('write failed'));

    const locale = await resolveSharingLocale('/ua/characters/character-1/dialog?inviteCode=abc');

    expect(locale).toBe('fr');
    expect(mocks.dbUpdateCharacterFilterGroupMock).toHaveBeenCalledTimes(1);
  });

  it('returns default locale when character does not exist', async () => {
    const { resolveSharingLocale } = await import('./sharing-locale');
    mocks.dbGetCharacterByIdMock.mockResolvedValue(undefined);

    const locale = await resolveSharingLocale('/ua/characters/character-1/dialog?inviteCode=abc');

    expect(locale).toBe('de');
    expect(mocks.getUserAndContextByUserIdMock).not.toHaveBeenCalled();
  });

  it('returns default locale when learning scenario locale detection toggle is disabled', async () => {
    const { resolveSharingLocale } = await import('./sharing-locale');
    mocks.getUserAndContextByUserIdMock.mockResolvedValue({
      federalState: {
        id: 'federal-state-1',
        featureToggles: {
          isSharedPageLocaleDetectionEnabled: false,
        },
      },
    });

    const locale = await resolveSharingLocale(
      '/ua/learning-scenarios/scenario-1/dialog?inviteCode=1',
    );

    expect(locale).toBe('de');
    expect(mocks.getStrongAuxiliaryModelMock).not.toHaveBeenCalled();
    expect(mocks.generateTextWithBillingMock).not.toHaveBeenCalled();
  });

  it('resolves and persists locale for learning-scenario editor share route', async () => {
    const { resolveSharingLocale } = await import('./sharing-locale');
    mocks.generateTextWithBillingMock.mockResolvedValue({ text: 'italian' });

    const locale = await resolveSharingLocale('/learning-scenarios/editor/scenario-1/share');

    expect(locale).toBe('it');
    expect(mocks.dbUpdateLearningScenarioFilterGroupMock).toHaveBeenCalledWith({
      learningScenarioId: 'scenario-1',
      filterGroup: {
        school_types: [],
        grade_ranges: [],
        subjects: [],
        categories: [],
        federal_states: [],
        languages: ['italian'],
      },
    });
  });

  it('falls back to default locale when auxiliary model answer contains multiple languages', async () => {
    const { resolveSharingLocale } = await import('./sharing-locale');
    mocks.generateTextWithBillingMock.mockResolvedValue({ text: 'de, en' });

    const locale = await resolveSharingLocale(
      '/ua/learning-scenarios/scenario-1/dialog?inviteCode=1',
    );

    expect(locale).toBe('de');
    expect(mocks.dbUpdateLearningScenarioFilterGroupMock).toHaveBeenCalledWith({
      learningScenarioId: 'scenario-1',
      filterGroup: {
        school_types: [],
        grade_ranges: [],
        subjects: [],
        categories: [],
        federal_states: [],
        languages: ['german'],
      },
    });
  });

  it('extracts language via character system prompt and auxiliary model answer', async () => {
    const { resolveSharingLocale } = await import('./sharing-locale');
    mocks.generateTextWithBillingMock.mockResolvedValue({ text: 'fr' });
    mocks.constructCharacterLanguageSystemPromptMock.mockReturnValue('prompt-from-character');

    const locale = await resolveSharingLocale('/ua/characters/character-1/dialog?inviteCode=abc');

    expect(locale).toBe('fr');
    expect(mocks.constructCharacterLanguageSystemPromptMock).toHaveBeenCalledWith({
      character: {
        id: 'character-1',
        userId: 'teacher-1',
        filterGroup: undefined,
      },
    });
    expect(mocks.generateTextWithBillingMock).toHaveBeenCalledWith(
      'aux-model-1',
      [
        {
          role: 'system',
          content:
            'Determine the language in which the following assistant will respond to messages. Respond exclusively with one of the following language codes: de, en, fr, it, ar. If the language is not clear, respond with de.',
        },
        {
          role: 'system',
          content: 'prompt-from-character',
        },
      ],
      'api-key-1',
    );
  });

  it('returns default locale when detected locale is unknown', async () => {
    const { resolveSharingLocale } = await import('./sharing-locale');
    mocks.generateTextWithBillingMock.mockResolvedValue({ text: 'klingon' });

    const locale = await resolveSharingLocale(
      '/ua/learning-scenarios/scenario-1/dialog?inviteCode=1',
    );

    expect(locale).toBe('de');
  });
});
