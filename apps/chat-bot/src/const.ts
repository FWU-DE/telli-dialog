export const SUPPORTED_DOCUMENTS_EXTENSIONS = [
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
];

export const SUPPORTED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'svg'];

export const SUPPORTED_FILE_EXTENSIONS = [
  ...SUPPORTED_DOCUMENTS_EXTENSIONS,
  ...SUPPORTED_IMAGE_EXTENSIONS,
];

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
