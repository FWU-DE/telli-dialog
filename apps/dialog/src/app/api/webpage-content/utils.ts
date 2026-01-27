// Extract the first-level heading from markdown content
export const extractTitleFromMarkdown = (markdown: string): string | undefined => {
  const headingMatch = markdown.match(/^#\s+(.+)$/m);
  return headingMatch?.[1]?.trim();
};
