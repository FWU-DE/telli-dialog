'use client';

import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nightOwl } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useTranslations } from 'next-intl';
import { Button } from '@ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@ui/components/dialog';
import { CodeIcon, DesktopIcon } from '@phosphor-icons/react';
import { cn } from '@/utils/tailwind';
import CopyToClipboardButton from '../common/clipboard-button';
import { downloadFileFromBlob } from '@/utils/files/blob-download';
import {
  buildPreviewSrcDoc,
  previewDownloadFileName,
  previewDownloadMimeType,
} from './html-preview-srcdoc';
import {
  LLM_HTML_IFRAME_REFERRER_POLICY,
  LLM_HTML_IFRAME_SANDBOX,
} from './sandboxed-llm-html-iframe';

type MarkdownFencedCodeBlockProps = {
  language: string;
  code: string;
  downloadFileBasename?: string | null;
} & Record<string, unknown>;

const PREVIEW_LANGUAGES = new Set(['html', 'svg']);

export function MarkdownFencedCodeBlock({
  language,
  code,
  downloadFileBasename,
  ...syntaxHighlighterProps
}: MarkdownFencedCodeBlockProps) {
  const t = useTranslations('htmlPreview');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  const showPreview = PREVIEW_LANGUAGES.has(language.toLowerCase());
  const srcDoc = showPreview ? buildPreviewSrcDoc(code, language.toLowerCase()) : '';

  function handleDownload() {
    const blob = new Blob([code], { type: previewDownloadMimeType(language.toLowerCase()) });
    downloadFileFromBlob(
      blob,
      previewDownloadFileName(language.toLowerCase(), downloadFileBasename),
    );
  }

  return (
    <>
      <div className="flex flex-col py-2 text-sm max-w-full">
        <div className="flex items-center justify-center bg-gray-300 py-2 px-2 text-vidis-hover-purple gap-2">
          <span>{language}</span>
          <div className="grow" />
          {showPreview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1 text-vidis-hover-purple hover:bg-white/40"
              onClick={() => {
                setActiveTab('preview');
                setDialogOpen(true);
              }}
            >
              <DesktopIcon className="size-3.5 shrink-0" aria-hidden />
              {t('open-preview')}
            </Button>
          )}
          <CopyToClipboardButton text={code} />
        </div>
        <SyntaxHighlighter
          style={nightOwl}
          language={language.toLowerCase()}
          PreTag="pre"
          {...syntaxHighlighterProps}
          customStyle={{
            overflowX: 'auto',
            margin: '0rem',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>

      {showPreview && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent
            showCloseButton
            className={cn(
              'max-w-[min(100vw-2rem,56rem)] w-full max-h-[min(90vh,720px)] gap-0 p-0 overflow-hidden',
              'flex flex-col min-h-0',
            )}
          >
            <DialogHeader className="px-4 pt-4 pb-2 shrink-0 border-b border-border space-y-0 gap-0">
              <DialogTitle className="text-lg">{t('dialog-title')}</DialogTitle>
            </DialogHeader>

            <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/40 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn('gap-1.5 text-xs', activeTab === 'preview' && 'bg-accent')}
                onClick={() => setActiveTab('preview')}
              >
                <DesktopIcon className="size-3.5" />
                {t('tab-preview')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn('gap-1.5 text-xs', activeTab === 'code' && 'bg-accent')}
                onClick={() => setActiveTab('code')}
              >
                <CodeIcon className="size-3.5" />
                {t('tab-code')}
              </Button>
              <div className="grow" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleDownload}
              >
                {t('download')}
              </Button>
            </div>

            <div className="flex w-full max-h-[65vh] min-h-[50vh] flex-1 flex-col overflow-hidden bg-background">
              {activeTab === 'preview' ? (
                <iframe
                  title={t('iframe-title')}
                  sandbox={LLM_HTML_IFRAME_SANDBOX}
                  referrerPolicy={LLM_HTML_IFRAME_REFERRER_POLICY}
                  srcDoc={srcDoc || buildPreviewSrcDoc('', language.toLowerCase())}
                  className="block min-h-0 w-full flex-1 border-0 bg-white"
                />
              ) : (
                <div className="flex min-h-0 flex-1 overflow-auto overscroll-contain">
                  <SyntaxHighlighter
                    style={nightOwl}
                    language={language.toLowerCase()}
                    showLineNumbers
                    wrapLongLines
                    customStyle={{
                      margin: 0,
                      padding: '0.75rem 1rem',
                      fontSize: '0.8125rem',
                      lineHeight: 1.55,
                      minWidth: 'min-content',
                    }}
                    lineNumberStyle={{
                      minWidth: '2.75rem',
                      paddingRight: '1rem',
                      userSelect: 'none',
                      opacity: 0.55,
                    }}
                  >
                    {code}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
