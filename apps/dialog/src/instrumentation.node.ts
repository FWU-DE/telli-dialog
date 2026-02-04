import { initSentry } from '@shared/sentry/server-init';

initSentry({
  serviceName: 'telli-dialog',
  traceExcludedUrls: ['/api/healthz'],
});
