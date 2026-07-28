import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadFileFromBlob } from './blob-download';

describe('downloadFileFromBlob', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a blob URL, sets download on an anchor, clicks, then revokes (contract)', () => {
    const removeChild = vi.fn();
    const appendChild = vi.fn();
    const body = { appendChild, removeChild };
    const link = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      parentNode: body as unknown as ParentNode,
    };
    const createObjectURL = vi.fn(() => 'blob:test-url');
    const revokeObjectURL = vi.fn();

    vi.stubGlobal('document', {
      createElement: vi.fn(() => link),
      body,
    } as unknown as Document);

    vi.stubGlobal('window', {
      URL: {
        createObjectURL,
        revokeObjectURL,
      },
    } as unknown as Window & typeof globalThis);

    const blob = new Blob(['<p>x</p>'], { type: 'text/html' });
    downloadFileFromBlob(blob, 'export.html');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(link.setAttribute).toHaveBeenCalledWith('download', 'export.html');
    expect(appendChild).toHaveBeenCalledWith(link);
    expect(link.click).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalledWith(link);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  it('passes fileName verbatim to the download attribute (callers must sanitize)', () => {
    const body = {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    };
    const link = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      parentNode: body as unknown as ParentNode,
    };
    vi.stubGlobal('document', {
      createElement: vi.fn(() => link),
      body,
    } as unknown as Document);
    vi.stubGlobal('window', {
      URL: {
        createObjectURL: vi.fn(() => 'blob:x'),
        revokeObjectURL: vi.fn(),
      },
    } as unknown as Window & typeof globalThis);

    downloadFileFromBlob(new Blob([]), '..\\..\\evil.txt');
    expect(link.setAttribute).toHaveBeenCalledWith('download', '..\\..\\evil.txt');
  });
});
