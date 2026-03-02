import React from 'react';

type ContentDisplayProps = {
  content: string;
};

export function getFileNameWithoutExtension(fileName: string) {
  const parts = fileName.split('.');

  if (parts.length === 1) {
    return fileName;
  }

  return parts.slice(0, -1).join('.');
}

export default function ParagraphWithConditionalTitle({ content }: ContentDisplayProps) {
  const [isTruncated, setIsTruncated] = React.useState(false);
  const fileNameRef = React.useRef<HTMLParagraphElement>(null);

  React.useEffect(() => {
    if (fileNameRef.current) {
      setIsTruncated(fileNameRef.current.scrollWidth > fileNameRef.current.offsetWidth);
    }
  }, [content]);

  return (
    <p
      className="truncate ... overflow-hidden max-w-44 font-medium text-sm"
      title={isTruncated ? content : undefined}
      ref={fileNameRef}
    >
      {getFileNameWithoutExtension(content)}
    </p>
  );
}

// TODO: This component is exactly 0 reusable but it was late at night, so I am sorry
export function ParagraphWithConditionalTitleTwoLine({ content }: ContentDisplayProps) {
  const [isTruncated, setIsTruncated] = React.useState(false);
  const paragraphRef = React.useRef<HTMLParagraphElement>(null);

  React.useEffect(() => {
    if (paragraphRef.current) {
      setIsTruncated(paragraphRef.current.scrollHeight > paragraphRef.current.clientHeight);
    }
  }, [content]);

  return (
    <p
      className="line-clamp-2 text-left"
      title={isTruncated ? content : undefined}
      ref={paragraphRef}
    >
      {content}
    </p>
  );
}
