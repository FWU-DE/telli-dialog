export const TEXT_INPUT_FIELDS_LENGTH_LIMIT = 500;
export const TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS = 4000;
export const CHAT_MESSAGE_LENGTH_LIMIT = 6000;
export const SMALL_TEXT_INPUT_FIELDS_LIMIT = 50;
export const TOTAL_CHAT_LENGTH_LIMIT = 20_000;
export const FILE_SEARCH_LIMIT = 10; // Number of file chunks to retrieve one file chunk is approximately 300 words or 400-500 tokens
export const USER_WARNING_FOR_TRUNCATED_FILES = `Die Datei ist länger als ${CHAT_MESSAGE_LENGTH_LIMIT} Zeichen und wird daher abgeschnitten.`;
export const FORM_NUMBER_FILES_LIMIT = 20;
export const NUMBER_OF_FILES_LIMIT = 20;
export const NUMBER_OF_IMAGES_LIMIT = 5;

export const SMALL_MODEL_MAX_CHARACTERS = 4000;
export const SMALL_MODEL_LIST = ['Mistral-7B', 'Llama-3.1-8B', 'Mistral-8x7B'];
