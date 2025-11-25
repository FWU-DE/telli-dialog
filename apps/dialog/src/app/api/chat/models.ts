export const DEFAULT_CHAT_MODEL: string = 'gpt-5-nano';
/* Auxilary tasks are chat history condensation and keyword extraction
which are resource intensive and should be done with a less powerful model
*/
export const DEFAULT_AUXILIARY_MODEL: string = 'gpt-5-nano';
export const FALLBACK_AUXILIARY_MODEL: string = 'meta-llama/Llama-3.3-70B-Instruct';
