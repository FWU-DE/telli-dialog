import React from 'react';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nightOwl } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';
import RehypeKatex from 'rehype-katex';
import RemarkMathPlugin from 'remark-math';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/utils/tailwind';
import TelliClipboardButton from '../common/clipboard-button';

type MarkdownDisplayProps = {
  children: string;
};

function preprocessMathDelimiters(markdown: string) {
  return (
    markdown
      // Replace \( ... \) with $ ... $ for inline math
      .replace(/\\\((.*?)\\\)/gs, (_, content) => `$${content}$`)
      // Replace \[ ... \] with $$ ... $$ for block math
      .replace(/\\\[(.*?)\\\]/gs, (_, content) => `$$${content}$$`)
  );
}

export default function MarkdownDisplay({ children: _children }: MarkdownDisplayProps) {
  const children = preprocessMathDelimiters(_children);

  return (
    <Markdown
      className="break-words text-base"
      remarkPlugins={[RemarkMathPlugin, remarkGfm]}
      rehypePlugins={[RehypeKatex]}
      components={{
        a({ href, children, ...props }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#46217E', textDecoration: 'underline', textUnderlineOffset: '4px' }}
              {...props}
            >
              {children}
            </a>
          );
        },
        // @ts-expect-error plugin errors
        inlineMath({ value }) {
          return (
            <span
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(value, { displayMode: false }),
              }}
            />
          );
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        hr({ ...props }) {
          return <div className="py-1" />;
        },
        th({ children, ...props }) {
          return (
            <th {...props} className="text-left p-2 border-[1px] bg-slate-100 font-medium">
              {children}
            </th>
          );
        },
        td({ children, ...props }) {
          return (
            <td {...props} className="p-2 border-[1px]">
              {children}
            </td>
          );
        },
        tr({ children, ...props }) {
          return <tr {...props}>{children}</tr>;
        },
        table({ children, ...props }) {
          return (
            <table
              {...props}
              className="w-full border-[1px] my-4 first:mt-0 last:mb-0 border-collapse"
            >
              {children}
            </table>
          );
        },
        strong({ children, ...props }) {
          return (
            <strong className="font-semibold" {...props}>
              {children}
            </strong>
          );
        },
        ul({ children, ...props }) {
          return (
            <ul className="ml-6 py-1 space-y-2 list-square" {...props}>
              {children}
            </ul>
          );
        },
        ol({ children, ...props }) {
          return (
            <ol className="list-decimal ml-6 py-1 space-y-2" {...props}>
              {children}
            </ol>
          );
        },
        li({ children, ...props }) {
          return <li {...props}>{children}</li>;
        },
        p({ children, ...props }) {
          return (
            <p className="pt-1 pb-3 first:pt-0 last:pb-0 whitespace-pre-wrap" {...props}>
              {children}
            </p>
          );
        },
        code({ className, children, ...props }) {
          const sanitizedText = String(children).replace(/\n$/, '');
          const match = /language-(\w+)/.exec(className || '');

          const language = match?.[1];

          if (language === undefined) {
            return (
              <code className={cn(className, 'break-words bg-main-200 px-0.5 text-wrap text-sm')}>
                {children}
              </code>
            );
          }

          return (
            <div className="flex flex-col py-2 text-sm max-w-full">
              <div className="flex items-center justify-center bg-gray-300 py-2 px-2 text-vidis-hover-purple">
                {language !== undefined && <span>{language}</span>}
                <div className="flex-grow" />
                <TelliClipboardButton text={sanitizedText} />
              </div>
              <SyntaxHighlighter
                // @ts-expect-error wrong typing
                style={nightOwl}
                language={language}
                PreTag="pre"
                {...props}
                customStyle={{
                  overflowX: 'auto',
                  margin: '0rem',
                }}
              >
                {sanitizedText}
              </SyntaxHighlighter>
            </div>
          );
        },
      }}
    >
      {children}
    </Markdown>
  );
}
