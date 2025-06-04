export const SUPPORTED_FILE_EXTENSIONS = ['docx', 'pdf', 'md', 'txt'];
export type SUPPORTED_FILE_TYPE = (typeof SUPPORTED_FILE_EXTENSIONS)[number];

/** This is currently only used to check if a file is an image */
export const SUPPORTED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'] as const;
export type SUPPORTED_IMAGE_TYPE = (typeof SUPPORTED_IMAGE_EXTENSIONS)[number];

export const TRUNCATE_IMAGE_HEIGHT = 720;

export const MAX_FILE_SIZE = 20_000_000; // 20MB
export const EMBEDDING_BATCH_SIZE = 100;
