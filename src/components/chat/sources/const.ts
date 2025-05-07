import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';

export const defaultErrorSource: WebsearchSource = {
  content: 'Fehler beim Laden der Seite',
  type: 'websearch',
  name: 'Nicht verfügbar',
  link: '',
  hostname: '',
};
