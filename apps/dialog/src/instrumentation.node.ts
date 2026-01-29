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
import { env } from '@/env';

const sentryClient = Sentry.init({
  debug: false,
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  integrations: [Sentry.captureConsoleIntegration({ levels: ['warn', 'error'] })],
  // Define how likely traces are sampled. Adjust this value in production or use tracesSampler for greater control.
  profileSessionSampleRate: 0.01,
  tracesSampleRate: 1,
  // Use custom OpenTelemetry configuration, see https://docs.sentry.io/platforms/javascript/guides/node/opentelemetry/custom-setup/
  skipOpenTelemetrySetup: true,
  registerEsmLoaderHooks: false,
});

// For debugging purposes, you can uncomment the following two lines to enable console logging
// import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const SERVICE_NAME = 'telli-dialog';

const exporter = new OTLPMetricExporter();
const periodicExportingMetricReader = new PeriodicExportingMetricReader({
  exporter,
  exportIntervalMillis: Number.parseInt(process.env.OTEL_METRIC_EXPORT_INTERVAL ?? '60000'),
  exportTimeoutMillis: Number.parseInt(process.env.OTEL_METRIC_EXPORT_TIMEOUT ?? '30000'),
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
    [ATTR_SERVICE_NAME]: SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: env.appVersion,
  }),
  metricReaders: [periodicExportingMetricReader],
  sampler: sentryClient ? new SentrySampler(sentryClient) : undefined,
  serviceName: SERVICE_NAME,
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
