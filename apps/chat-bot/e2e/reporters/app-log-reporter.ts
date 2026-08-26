import fs from 'node:fs';
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

/**
 * Attaches server- and container-side logs to each Playwright test by time-slicing
 * timestamped log files against the test's execution window.
 *
 * The app log is prefixed with UTC ISO seconds by the CI workflow; container logs
 * carry RFC3339Nano timestamps from `docker compose logs --timestamps`. Because app
 * timestamps are second-resolution and tests run in parallel, slices are approximate:
 * TOLERANCE_MS pads the window and adjacent/concurrent tests may share some lines.
 *
 * Missing log files are skipped silently so local runs are unaffected.
 */

const TOLERANCE_MS = 1500;

type Source = { name: string; file: string };

const SOURCES: Source[] = [
  { name: 'app-server-log', file: '/tmp/ais-chat-app.log' },
  { name: 'container-logs', file: '/tmp/container-logs.log' },
];

/**
 * Parses the leading whitespace-delimited token of a log line as a timestamp.
 * Returns null when the token is not a valid date (e.g. a stack-trace line).
 */
function parseLeadingTimestamp(line: string): number | null {
  const token = line.slice(0, line.indexOf(' '));
  if (token.length === 0) return null;
  const ms = Date.parse(token);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Returns the log lines whose timestamp falls within [start, end].
 * Lines without a parseable timestamp inherit the previous line's timestamp,
 * keeping multi-line entries (e.g. stack traces) attached to their header line.
 */
function sliceByWindow(content: string, start: number, end: number): string {
  const result: string[] = [];
  let lastTs: number | null = null;

  for (const line of content.split('\n')) {
    const ts: number | null = parseLeadingTimestamp(line) ?? lastTs;
    if (ts !== null) lastTs = ts;
    if (ts !== null && ts >= start && ts <= end) {
      result.push(line);
    }
  }

  return result.join('\n');
}

export default class AppLogReporter implements Reporter {
  onTestEnd(_test: TestCase, result: TestResult): void {
    if (!result.startTime) return;

    const start = result.startTime.getTime() - TOLERANCE_MS;
    const end = result.startTime.getTime() + result.duration + TOLERANCE_MS;

    for (const { name, file } of SOURCES) {
      let content: string;
      try {
        content = fs.readFileSync(file, 'utf8');
      } catch {
        continue;
      }

      const slice = sliceByWindow(content, start, end);
      if (slice.trim().length === 0) continue;

      result.attachments.push({
        name,
        contentType: 'text/plain',
        body: Buffer.from(slice, 'utf8'),
      });
    }
  }
}
