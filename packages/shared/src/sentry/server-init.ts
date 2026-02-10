import Sentry, { SentryContextManager } from '@sentry/nextjs';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { SentrySampler, SentrySpanProcessor } from '@sentry/opentelemetry';
import { env } from './env';

/**
 * Initializes Sentry and OpenTelemetry for server-side application.
 */
export function initSentry(opts: {
  serviceName: string;
  /** List of URL paths, which should not be traced */
  traceExcludedUrls: string[];
}) {
  const sentryClient = Sentry.init({
    debug: false,
    dsn: env.sentryDsn,
    environment: env.sentryEnvironment,
    integrations: [
      Sentry.captureConsoleIntegration({ levels: ['fatal', 'error', 'warn', 'info'] }),
    ],
    beforeSend(event) {
      const level = event.level;

      // In production only send fatal, error, and warning events to Sentry
      if (env.sentryEnvironment === 'production') {
        return level === 'fatal' || level === 'error' || level === 'warning' ? event : null;
      }
      // In non-production, send fatal, error, warning and info to Sentry
      return level === 'fatal' || level === 'error' || level === 'warning' || level === 'info'
        ? event
        : null;
    },
    tracesSampler: ({ normalizedRequest, inheritOrSampleWith }) => {
      const url = normalizedRequest?.url ?? '';
      // Extract pathname if it's a full URL, otherwise use as-is
      const pathname = url.startsWith('http') ? new URL(url).pathname : url.split('?')[0];

      const isExcludedUrl = opts.traceExcludedUrls.includes(pathname ?? '');
      if (isExcludedUrl) {
        return 0;
      }

      return inheritOrSampleWith(env.sentryTracesSampleRate);
    },
    // Use custom OpenTelemetry configuration, see https://docs.sentry.io/platforms/javascript/guides/node/opentelemetry/custom-setup/
    skipOpenTelemetrySetup: true,
    registerEsmLoaderHooks: false,
  });

  // For debugging purposes, you can uncomment the following two lines to enable console logging
  // import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
  // diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

  const exporter = new OTLPMetricExporter();
  const periodicExportingMetricReader = new PeriodicExportingMetricReader({
    exporter,
    exportIntervalMillis: env.otelMetricExportInterval,
    exportTimeoutMillis: env.otelMetricExportTimeout,
  });

  // Documentation for the OpenTelemetry SDK for Node.js can be found here:
  // https://www.npmjs.com/package/@opentelemetry/sdk-node
  const sdk = new NodeSDK({
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': {
          requestHook: (span, msg) => {
            const path = 'path' in msg ? msg.path : msg.url;
            span.updateName(`${msg.method} ${path}`);
          },
        },
      }),
    ],
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: opts.serviceName,
      [ATTR_SERVICE_VERSION]: env.appVersion,
    }),
    metricReaders: [periodicExportingMetricReader],
    sampler: sentryClient ? new SentrySampler(sentryClient) : undefined,
    serviceName: opts.serviceName,
    spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter()), new SentrySpanProcessor()],
    contextManager: new SentryContextManager(),
  });

  sdk.start();

  // gracefully shut down the SDK on process exit
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });

  Sentry.validateOpenTelemetrySetup();
}
