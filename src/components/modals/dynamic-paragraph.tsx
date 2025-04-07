import { cn } from '@/utils/tailwind';
import { ReactNode } from 'react';

/**
 * react Component, resolving markdown links
 * @param text - The text paragraph to convert
 * @param index - The index of the paragraph in the array
 * @returns A React paragraph element with resolved links
 */
export function DynamicParagraph({
  children,
  index,
  className,
}: {
  children: string;
  index: number;
  className?: string;
}) {
  // Regular expression to find raw URLs (not part of markdown links)
  const rawUrlRegex = /(https?:\/\/[^\s}]+|www\.[^\s}]+|[^\s]+\.[a-z]{2,}\/[^\s}]+)/g;
  const defaultClassName = cn('text-normal w-full text-left', className);
  // First, let's convert any raw URLs to markdown format
  const textWithMarkdownLinks = children.replace(rawUrlRegex, (url: string): string => {
    // Clean up the URL if it has a closing bracket or other punctuation
    if (url.endsWith('}')) {
      url = url.substring(0, url.length - 1);
    }

    // Create markdown link
    return url;
  });

  // Now parse markdown links [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  // Check if text contains markdown links
  if (!markdownLinkRegex.test(textWithMarkdownLinks)) {
    // If no markdown links, just return the text as a paragraph
    return (
      <p key={`paragraph-${index}`} className={defaultClassName}>
        {textWithMarkdownLinks}
      </p>
    );
  }

  // Reset the regex lastIndex
  markdownLinkRegex.lastIndex = 0;

  // Split the text by markdown links, capturing the links as well
  const parts: Array<ReactNode> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = markdownLinkRegex.exec(textWithMarkdownLinks)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(textWithMarkdownLinks.substring(lastIndex, match.index));
    }

    // Extract the link text and URL
    const linkText: string = match[1] ?? '';
    const linkUrl: string = match[2] ?? '';
    // Add protocol if missing

    parts.push(
      <a
        key={`link-${index}-${parts.length}`}
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800 cursor-pointer"
      >
        {linkText}
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text
  if (lastIndex < textWithMarkdownLinks.length) {
    parts.push(textWithMarkdownLinks.substring(lastIndex));
  }

  // Return the paragraph with embedded links
  return (
    <p key={`paragraph-${index}`} className={defaultClassName}>
      {parts}
    </p>
  );
}
