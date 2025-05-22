export const SUPPORTED_FILE_EXTENSIONS = ['docx', 'pdf', 'md', 'txt'];
export type SUPPORTED_FILE_TYPE = (typeof SUPPORTED_FILE_EXTENSIONS)[number];

/** enable local storage for character and shared chats this only affects shared chats */
export const LOCAL_STORAGE_ENABLED = false;

export const MAX_FILE_SIZE = 20_000_000; // 20MB
export const EMBEDDING_BATCH_SIZE = 100;
