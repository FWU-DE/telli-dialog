export const SUPPORTED_DOCUMENTS_EXTENSIONS = ['docx', 'pdf', 'md', 'txt'];
export type SUPPORTED_DOCUMENTS_TYPE = (typeof SUPPORTED_DOCUMENTS_EXTENSIONS)[number];

/** This is currently only used to check if a file is an image */
export const SUPPORTED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'svg'] as const;
export type SUPPORTED_IMAGE_TYPE = (typeof SUPPORTED_IMAGE_EXTENSIONS)[number];

export const TRUNCATE_IMAGE_HEIGHT = 720;

export const MAX_FILE_SIZE = 20_000_000; // 20MB
export const EMBEDDING_BATCH_SIZE = 100;

/**
 * Maximum number of concurrent requests.
 * IONOS rate limiting is 5 requests/second.
 * https://docs.ionos.com/cloud/ai/ai-model-hub/tutorials/rate-limits
 *
 * Note: this is just a simple check, it does not scale horizontally when the application is deployed with multiple pods
 */
export const EMBEDDING_MAX_CONCURRENT_REQUESTS = 5;
