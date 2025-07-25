import React from 'react';

type ParagraphWithConditionalTitleTwoLineProps = {
  content: string;
};

export function ParagraphWithConditionalTitleTwoLine({
  content,
}: ParagraphWithConditionalTitleTwoLineProps) {
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
