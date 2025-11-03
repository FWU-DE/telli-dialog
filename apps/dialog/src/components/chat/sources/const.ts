import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';
import { useTranslations } from 'next-intl';

/**
 * get a default error source for a websearch source
 * @param status_code - the status code of the error
 * @param t - the translation function of the "websearch" namespace
 * @returns a default error source for a websearch source
 */
export function defaultErrorSource({
  status_code,
  t,
}: {
  status_code?: number;
  t: ReturnType<typeof useTranslations>;
}): WebsearchSource {
  const statusCodeInfo = status_code ? `(Statuscode: ${status_code})` : '';
  return {
    content: t('placeholders.error-content', { status_code_info: statusCodeInfo }),
    type: 'websearch',
    name: t('placeholders.not-available'),
    error: true,
    link: '',
  };
}
