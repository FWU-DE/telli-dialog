/*
 * Chosen approach: Cooperative shutdown with Next.js
 *
 * Benefits:
 * - Leverages Next.js's shutdown logic (connection draining, trace flush)
 * - Minimal code changes
 * - Next.js's internal process.exit() prevents indefinite hangs
 *
 * Trade-off: Small race condition remains (cleanup may not complete before Next.js exits)
 * Acceptable because cleanup typically completes quickly and Next.js prevents worst-case hangs.
 *
 * Alternative considered: NEXT_MANUAL_SIG_HANDLE=true for full shutdown control.
 * Not used because it requires reimplementing Next.js shutdown logic and may break on framework upgrades.
 *
 * Note: console.log is used for shutdown logging because remote logging (Sentry/OpenTelemetry)
 * may not be available during shutdown.
 */

const cleanupHandlers: Array<() => Promise<void>> = [];
let handlersRegistered = false;
let cleanupInProgress = false;

/**
 * Register a cleanup handler for graceful shutdown on SIGTERM/SIGINT.
 */
export function registerCleanupHandler(handler: () => Promise<void>): void {
  cleanupHandlers.push(handler);

  if (!handlersRegistered) {
    handlersRegistered = true;

    const executeCleanup = async (signal: 'SIGTERM' | 'SIGINT') => {
      if (cleanupInProgress) return;
      cleanupInProgress = true;

      console.log(`[shutdown] Received ${signal}, starting resource cleanup...`);

      const results = await Promise.allSettled(cleanupHandlers.map((handler) => handler()));

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`[shutdown] Cleanup handler ${index} failed:`, result.reason);
        }
      });

      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        console.error(`[shutdown] ${failed} cleanup handler(s) failed`);
      } else {
        console.log('[shutdown] Resource cleanup completed successfully');
      }
    };

    process.once('SIGTERM', () => void executeCleanup('SIGTERM'));
    process.once('SIGINT', () => void executeCleanup('SIGINT'));
  }
}
