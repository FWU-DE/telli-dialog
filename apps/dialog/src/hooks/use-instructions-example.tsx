'use client';

import { ReactElement } from 'react';
import { useTranslations } from 'next-intl';

type InstructionNamespace = 'assistants' | 'characters' | 'learning-scenarios';

type InstructionSection = { heading: string; content: string };

type UseInstructionsExampleResult = {
  instructionsPlaceholder: string;
  instructionsExampleDialogContent: ReactElement;
};

export function useInstructionsExample(
  namespace: InstructionNamespace,
): UseInstructionsExampleResult {
  const t = useTranslations(namespace);
  // t.raw() key type is too narrow when namespace is a union — use double cast to bypass
  const sections = Object.entries(
    (t.raw as unknown as (key: string) => unknown)('instructions-placeholder') as Record<
      string,
      InstructionSection
    >,
  );

  const instructionsPlaceholder = sections
    .map(([, section]) => `${section.heading}\n${section.content}`)
    .join('\n\n');

  const instructionsExampleDialogContent = (
    <div className="whitespace-pre-wrap">
      {sections.map(([key, section]) => (
        <div key={key} className="mb-4">
          <p className="text-gray-500">{section.heading}</p>
          <p>{section.content}</p>
        </div>
      ))}
    </div>
  );

  return { instructionsPlaceholder, instructionsExampleDialogContent };
}
