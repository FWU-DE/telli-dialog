/**
 * Calculates the time left (in seconds) for a shared chat (either learning scenario or character).
 * Returns -1 if the chat has been manually stopped (manuallyStoppedAt is set) or if required fields are missing.
 *
 * Uses the expiredAt timestamp directly to determine remaining time.
 */
export function calculateTimeLeft({
  expiredAt,
  manuallyStoppedAt,
}: {
  expiredAt: Date | null;
  manuallyStoppedAt?: Date | null;
}) {
  if (manuallyStoppedAt) {
    return -1;
  }

  if (expiredAt === null) {
    return -1;
  }

  const expiredAtDate = new Date(expiredAt);

  const nowUtc = new Date().toISOString();
  const nowUtcDate = new Date(nowUtc);

  const sharedChatTimeLeft = Math.floor((expiredAtDate.getTime() - nowUtcDate.getTime()) / 1000);

  return sharedChatTimeLeft;
}
