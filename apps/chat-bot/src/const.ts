const DOCUMENT_EXTENSIONS_TUPLE = [
  'docx',
  'pdf',
  'md',
  'txt',
  'pptx',
  'odp',
  'csv',
  'xlsx',
  'ods',
  'odt',
  'tex',
] as const;
export const SUPPORTED_DOCUMENTS_EXTENSIONS: readonly string[] = DOCUMENT_EXTENSIONS_TUPLE;
export type SUPPORTED_DOCUMENTS_TYPE = (typeof DOCUMENT_EXTENSIONS_TUPLE)[number];

/** This is currently only used to check if a file is an image */
const IMAGE_EXTENSIONS_TUPLE = ['png', 'jpg', 'jpeg', 'webp', 'svg'] as const;
export const SUPPORTED_IMAGE_EXTENSIONS: readonly string[] = IMAGE_EXTENSIONS_TUPLE;
export type SUPPORTED_IMAGE_TYPE = (typeof IMAGE_EXTENSIONS_TUPLE)[number];
/**
 * The maximum size in pixels (width or height) of an avatar. Larger images will be scaled down.
 * The maximum CSS size for avatars is 170px in the UI. For high DPR screens, we allow images up to 2x the maximum CSS size to ensure they look sharp.
 */
export const AVATAR_MAX_SIZE = 340;

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
