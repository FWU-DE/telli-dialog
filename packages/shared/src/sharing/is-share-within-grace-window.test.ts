import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isShareWithinGraceWindow } from './is-share-within-grace-window';
import { SHARE_EXTENSION_WINDOW_MS } from './const';

describe('isShareWithinGraceWindow', () => {
  const NOW = new Date('2025-01-15T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true when share expired before grace window boundary', () => {
    // Expire just before the grace window ends
    const almostAtBoundary = new Date(NOW.getTime() - SHARE_EXTENSION_WINDOW_MS + 1000);
    expect(isShareWithinGraceWindow(almostAtBoundary, SHARE_EXTENSION_WINDOW_MS)).toBe(true);
  });

  it('should return false when share expired exactly at grace window start', () => {
    // Expire exactly at the grace window boundary
    const atBoundary = new Date(NOW.getTime() - SHARE_EXTENSION_WINDOW_MS);
    expect(isShareWithinGraceWindow(atBoundary, SHARE_EXTENSION_WINDOW_MS)).toBe(false);
  });

  it('should return false when share expired after grace window', () => {
    // Grace window is 2 hours, expire 2 hours and 1 second ago
    const outsideGraceWindow = new Date(NOW.getTime() - SHARE_EXTENSION_WINDOW_MS - 1000);
    expect(isShareWithinGraceWindow(outsideGraceWindow, SHARE_EXTENSION_WINDOW_MS)).toBe(false);
  });

  it('should use default grace window when not specified', () => {
    // 1 hour ago - should be within default 2 hour grace window
    const oneHourAgo = new Date(NOW.getTime() - 60 * 60 * 1000);
    expect(isShareWithinGraceWindow(oneHourAgo)).toBe(true);

    // Outside default grace window (2 hours and 1 second ago)
    const outsideDefault = new Date(NOW.getTime() - SHARE_EXTENSION_WINDOW_MS - 1000);
    expect(isShareWithinGraceWindow(outsideDefault)).toBe(false);
  });
});
