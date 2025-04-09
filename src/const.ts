export const SUPPORTED_FILE_EXTENSIONS = ['docx', 'pdf', 'md', 'txt', 'html', 'pages'] as const;
export type SUPPORTED_FILE_TYPE = (typeof SUPPORTED_FILE_EXTENSIONS)[number];
