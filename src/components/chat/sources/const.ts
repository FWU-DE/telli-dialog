import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';

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
  t: (key: string, params?: Record<string, string>) => string;
}): WebsearchSource {
  const statusCodeInfo = status_code ? `(Statuscode: ${status_code})` : '';
  return {
    content: t('source-display-invalid.content', { status_code_info: statusCodeInfo }),
    type: 'websearch',
    name: t('source-display-invalid.title'),
    error: true,
    link: '',
    hostname: '',
  };
}
