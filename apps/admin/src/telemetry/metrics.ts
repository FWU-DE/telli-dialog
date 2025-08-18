import { Counter, Gauge, Histogram, metrics, ValueType } from '@opentelemetry/api';

const meter = metrics.getMeter('telli.admin.version', '0.1.0');

let counter: Counter | undefined;
let gauge: Gauge | undefined;
let histogram: Histogram | undefined;

export function getCounter() {
  if (!counter) {
    counter = meter.createCounter('telli_admin_page_views', {
      description: 'Counts the number of times the page is viewed.',
    });
  }
  return counter;
}

export function getTokenConsumptionGauge() {
  if (!gauge) {
    gauge = meter.createGauge('telli_admin_token_consumption', {
      description: 'Tracks the amount of tokens that are consumed by the users.',
      valueType: ValueType.INT,
    });
  }
  return gauge;
}

export function getFileUploadHistogram() {
  if (!histogram) {
    histogram = meter.createHistogram('telli_admin_file_upload_size', {
      description: 'Tracks the size of file uploads.',
      unit: 'kB',
      valueType: ValueType.DOUBLE,
    });
  }
  return histogram;
}
