import { DEFAULT_CHAT_MODEL } from '@shared/llm-models/default-llm-models';
import { cookies } from 'next/headers';
import { LAST_USED_MODEL_COOKIE_NAME } from './chat/const';

export async function getDefaultModelNameByCookies() {
  const cookiesStore = await cookies();

  return cookiesStore.get(LAST_USED_MODEL_COOKIE_NAME)?.value.toString() ?? DEFAULT_CHAT_MODEL;
}
