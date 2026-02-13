import {
  getCounter,
  getTokenConsumptionGauge,
  getFileUploadHistogram,
} from '../../telemetry/metrics';
import { randomInt } from 'crypto';
import { logError } from '@shared/logging';

export default async function MetricsPage() {
  const counter = getCounter();
  const gauge = getTokenConsumptionGauge();
  const histogram = getFileUploadHistogram();

  function handleAddToHistogram() {
    try {
      histogram.record(randomInt(1000), { federal_state: 'Bayern' });
    } catch (error) {
      logError('Error adding to histogram', error);
    }
  }

  function handleSetGauge() {
    try {
      gauge.record(randomInt(10), { federal_state: 'Bayern' });
    } catch (error) {
      logError('Error setting gauge', error);
    }
  }

  function handleIncrementCounter() {
    try {
      counter.add(1, { federal_state: 'Bayern', page: 'Metrics' });
    } catch (error) {
      logError('Error incrementing counter', error);
    }
  }

  handleIncrementCounter();
  handleSetGauge();
  handleAddToHistogram();

  return (
    <div>Refresh page to increase metrics automatically. Metrics work only on server side.</div>
  );
}
