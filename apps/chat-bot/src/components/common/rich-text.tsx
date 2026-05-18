import { ReactNode } from 'react';

const RICH_TEXT_TAGS = ['b', 'i', 'p'] as const;

type Tag = (typeof RICH_TEXT_TAGS)[number];

export function stripRichTextTags(value: string): string {
  return RICH_TEXT_TAGS.reduce(
    (result, tag) => result.replaceAll(`<${tag}>`, '').replaceAll(`</${tag}>`, ''),
    value,
  );
}

type Props = {
  children(tags: Record<Tag, (chunks: ReactNode) => ReactNode>): ReactNode;
};

export function RichText({ children }: Props) {
  return (
    <>
      {children({
        b: (chunks) => <strong className="font-semibold">{chunks}</strong>,
        i: (chunks) => <i className="italic">{chunks}</i>,
        p: (chunks) => <p>{chunks}</p>,
      })}
    </>
  );
}
