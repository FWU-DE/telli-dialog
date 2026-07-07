/**
 * Configuration constants for share session expiration and grace periods.
 */

/**
 * Grace period (in hours) after a share session expires during which
 * the teacher can still extend the session or adjust token limits.
 *
 * After this window closes, the share is considered permanently expired
 * and a new share session must be started.
 *
 * Value: 2 hours
 */
const SHARE_EXTENSION_WINDOW_HOURS = 2;

/**
 * Same as SHARE_EXTENSION_WINDOW_HOURS, but in milliseconds for readability.
 * Value: 2 hours = 7,200,000 milliseconds
 */
export const SHARE_EXTENSION_WINDOW_MS = SHARE_EXTENSION_WINDOW_HOURS * 60 * 60 * 1000;
