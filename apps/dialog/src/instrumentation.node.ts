import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

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
  instrumentations: [getNodeAutoInstrumentations()],
  resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: SERVICE_NAME }),
  metricReader: periodicExportingMetricReader,
  serviceName: SERVICE_NAME,
  spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter())],
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
