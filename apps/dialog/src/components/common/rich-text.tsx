import { ReactNode } from 'react';

type Tag = 'b' | 'i' | 'p';

type Props = {
  children(tags: Record<Tag, (chunks: ReactNode) => ReactNode>): ReactNode;
};

export default function RichText({ children }: Props) {
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
