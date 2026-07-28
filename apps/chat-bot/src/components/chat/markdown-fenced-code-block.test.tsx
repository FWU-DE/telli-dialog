// @vitest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { downloadFileFromBlob } from '@/utils/files/blob-download';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@ui/components/button', () => ({
  Button: ({ children, onClick }: React.PropsWithChildren<{ onClick?: React.MouseEventHandler }>) =>
    React.createElement('button', { onClick }, children),
}));

vi.mock('@ui/components/dialog', () => ({
  Dialog: ({ children }: React.PropsWithChildren) =>
    React.createElement('div', { 'data-testid': 'dialog' }, children),
  DialogContent: ({ children }: React.PropsWithChildren) =>
    React.createElement('div', { 'data-testid': 'dialog-content' }, children),
  DialogHeader: ({ children }: React.PropsWithChildren) =>
    React.createElement('div', null, children),
  DialogTitle: ({ children }: React.PropsWithChildren) => React.createElement('h2', null, children),
}));

vi.mock('@phosphor-icons/react', () => ({
  CodeIcon: () => null,
  DesktopIcon: () => null,
}));

vi.mock('../common/clipboard-button', () => ({
  default: () => null,
}));

vi.mock('@/utils/files/blob-download', () => ({
  downloadFileFromBlob: vi.fn(),
}));

vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: React.PropsWithChildren) => React.createElement('pre', null, children),
}));

vi.mock('react-syntax-highlighter/dist/cjs/styles/prism', () => ({ nightOwl: {} }));

vi.mock('@/utils/tailwind', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

import { MarkdownFencedCodeBlock } from './markdown-fenced-code-block';

function render(jsx: React.ReactElement): { container: HTMLElement; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(jsx);
  });
  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

function getButtonByText(container: HTMLElement, text: string): HTMLButtonElement | null {
  return (Array.from(container.querySelectorAll('button')).find((b) =>
    b.textContent?.includes(text),
  ) ?? null) as HTMLButtonElement | null;
}

describe('MarkdownFencedCodeBlock', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not show a preview button for non-previewable languages', () => {
    const { container, unmount } = render(
      <MarkdownFencedCodeBlock language="python" code="print('hello')" />,
    );
    expect(getButtonByText(container, 'open-preview')).toBeNull();
    unmount();
  });

  it('shows a preview button for html', () => {
    const { container, unmount } = render(
      <MarkdownFencedCodeBlock language="html" code="<p>hi</p>" />,
    );
    expect(getButtonByText(container, 'open-preview')).not.toBeNull();
    unmount();
  });

  it('shows a preview button for svg (case-insensitive)', () => {
    const { container, unmount } = render(
      <MarkdownFencedCodeBlock
        language="SVG"
        code='<svg xmlns="http://www.w3.org/2000/svg"></svg>'
      />,
    );
    expect(getButtonByText(container, 'open-preview')).not.toBeNull();
    unmount();
  });

  it('clicking the preview button opens the dialog', () => {
    const { container, unmount } = render(
      <MarkdownFencedCodeBlock language="html" code="<p>hi</p>" />,
    );

    const previewBtn = getButtonByText(container, 'open-preview');
    expect(previewBtn).not.toBeNull();

    act(() => {
      previewBtn!.click();
    });

    // Dialog renders an iframe for preview tab (default)
    expect(container.querySelector('iframe')).not.toBeNull();
    unmount();
  });

  it('tab buttons switch between preview and code views', () => {
    const { container, unmount } = render(
      <MarkdownFencedCodeBlock language="html" code="<p>hi</p>" />,
    );

    act(() => {
      getButtonByText(container, 'open-preview')!.click();
    });
    // Initially on preview tab: iframe visible, no inner SyntaxHighlighter wrapper
    expect(container.querySelector('iframe')).not.toBeNull();

    // Switch to code tab
    act(() => {
      getButtonByText(container, 'tab-code')!.click();
    });
    expect(container.querySelector('iframe')).toBeNull();

    // Switch back to preview tab
    act(() => {
      getButtonByText(container, 'tab-preview')!.click();
    });
    expect(container.querySelector('iframe')).not.toBeNull();

    unmount();
  });

  it('download button calls downloadFileFromBlob with correct blob and filename', () => {
    const { container, unmount } = render(
      <MarkdownFencedCodeBlock language="html" code="<p>hello</p>" downloadFileBasename="MyChat" />,
    );

    act(() => {
      getButtonByText(container, 'open-preview')!.click();
    });

    act(() => {
      getButtonByText(container, 'download')!.click();
    });

    expect(downloadFileFromBlob).toHaveBeenCalledOnce();
    const call = (downloadFileFromBlob as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call).toBeDefined();
    const [blob, filename] = call!;
    expect(blob).toBeInstanceOf(Blob);
    expect(filename).toContain('html');
    expect(filename).toContain('MyChat');

    unmount();
  });

  it('download uses default filename when no basename provided', () => {
    const { container, unmount } = render(<MarkdownFencedCodeBlock language="svg" code="<svg/>" />);

    act(() => {
      getButtonByText(container, 'open-preview')!.click();
    });

    act(() => {
      getButtonByText(container, 'download')!.click();
    });

    const call = (downloadFileFromBlob as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call).toBeDefined();
    const [, filename] = call!;
    expect(filename).toContain('svg');
    expect(filename).not.toContain('undefined');

    unmount();
  });
});
