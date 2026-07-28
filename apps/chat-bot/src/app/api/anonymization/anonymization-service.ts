import { anonymizeText } from '@shared/anonymization/anonymize';
import { env } from '@/env';

/**
 * Anonymizes user-provided text before it is persisted or processed by AI services
 * (see docs/pii-anonymization.md). Uses the built-in pattern recognizers and, when
 * ANONYMIZATION_SERVICE_URL is configured, a Presidio analyzer for NER-based
 * detection of person names. Presidio failures propagate so the request fails closed.
 */
export async function anonymizeUserContent(text: string): Promise<string> {
  return anonymizeText({
    text,
    presidioUrl: env.anonymizationServiceUrl,
    language: env.anonymizationLanguage,
  });
}
