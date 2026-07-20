import { SHARE_EXTENSION_WINDOW_MS } from './const';

/**
 * Checks if a share is still within the grace window (i.e., either active or recently expired).
 * A share is considered manageable within the grace window if its expiration time is
 * not more than `graceWindowMs` milliseconds in the past.
 *
 * @param expiredAt The timestamp when the share expires/expired
 * @param graceWindowMs The grace window duration in milliseconds (default: SHARE_EXTENSION_WINDOW_MS)
 * @returns true if the share is within the grace window, false otherwise
 */
export function isShareWithinGraceWindow(
  expiredAt: Date,
  graceWindowMs: number = SHARE_EXTENSION_WINDOW_MS,
): boolean {
  const graceWindowStart = new Date(Date.now() - graceWindowMs);
  return expiredAt > graceWindowStart;
}
