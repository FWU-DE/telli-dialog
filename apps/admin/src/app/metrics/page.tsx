import {
  getCounter,
  getTokenConsumptionGauge,
  getFileUploadHistogram,
} from '../../telemetry/metrics';
import { randomInt } from 'crypto';

export default async function MetricsPage() {
  const counter = getCounter();
  const gauge = getTokenConsumptionGauge();
  const histogram = getFileUploadHistogram();

  function handleAddToHistogram() {
    try {
      histogram.record(randomInt(1000), { federal_state: 'Bayern' });
    } catch (error) {
      console.log(error);
    }
  }

  function handleSetGauge() {
    try {
      gauge.record(randomInt(10), { federal_state: 'Bayern' });
    } catch (error) {
      console.log(error);
    }
  }

  function handleIncrementCounter() {
    try {
      counter.add(1, { federal_state: 'Bayern', page: 'Metrics' });
    } catch (error) {
      console.log(error);
    }
  }

  handleIncrementCounter();
  handleSetGauge();
  handleAddToHistogram();

  return (
    <div>Refresh page to increase metrics automatically. Metrics work only on server side.</div>
  );
}
