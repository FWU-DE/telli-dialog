export const SCHOOL_TYPE_KEYS = [
  'elementary-school',
  'special-needs-school',
  'middle-school',
  'secondary-school',
  'grammar-school',
  'comprehensive-school',
  'vocational-school',
  'technicla-college',
  'other',
] as const;

export const GRADE_RANGE_KEYS = ['range-1', 'range-2', 'range-3', 'range-4'] as const;

export const CATEGORY_KEYS = [
  'artificial-intelligence',
  'writing',
  'projects',
  'coaching',
  'organisation',
  'feedback',
  'conversation',
  'historical-figures',
  'experts',
  'lesson-planning',
  'school-development',
  'teaching-material',
] as const;

export const FEDERAL_STATE_KEYS = [
  'baden-wuerttemberg',
  'bavaria',
  'berlin',
  'brandenburg',
  'bremen',
  'hamburg',
  'hesse',
  'mecklenburg-western-pomerania',
  'lower-saxony',
  'northrhine-westphalia',
  'rhineland-palatinate',
  'saarland',
  'saxony',
  'saxony-anhalt',
  'schleswig-holstein',
  'thuringia',
] as const;

export const LANGUAGE_KEYS = [
  'german',
  'english',
  'turkish',
  'french',
  'italian',
  'spanish',
  'greek',
  'latin',
  'russian',
] as const;

export const SUBJECT_GROUPS = [
  {
    titleKey: 'filter.subject-group-languages',
    translationKeys: [
      'languages.german',
      'subjects.german-as-second-language',
      'languages.english',
      'languages.french',
      'languages.greek',
      'languages.italian',
      'languages.latin',
      'languages.russian',
      'languages.spanish',
      'languages.turkish',
    ] as const,
  },
  {
    titleKey: 'filter.subject-group-social-sciences',
    translationKeys: [
      'subjects.geography',
      'subjects.history',
      'subjects.politics',
      'subjects.economics',
    ] as const,
  },
  {
    titleKey: 'filter.subject-group-arts',
    translationKeys: ['subjects.art', 'subjects.music', 'subjects.sports'] as const,
  },
  {
    titleKey: 'filter.subject-group-other',
    translationKeys: [
      'subjects.business-studies',
      'subjects.health',
      'subjects.intercultural-education',
      'subjects.media-education',
      'subjects.education',
      'subjects.psychology',
      'subjects.addiction-prevention',
      'subjects.comprehensive-subjects',
      'subjects.traffic-education',
    ] as const,
  },
  {
    titleKey: 'filter.subject-group-stem',
    translationKeys: [
      'subjects.biology',
      'subjects.chemistry',
      'subjects.informatics',
      'subjects.mathematics',
      'subjects.physics',
      'subjects.social-studies',
      'subjects.environmental-studies',
    ] as const,
  },
  {
    titleKey: 'filter.subject-group-ethics',
    translationKeys: ['subjects.ethics', 'subjects.philosophy', 'subjects.religion'] as const,
  },
] as const;
