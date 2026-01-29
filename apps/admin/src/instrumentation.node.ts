import { initSentry } from '@shared/sentry/server-init';

initSentry({
  serviceName: 'telli-admin',
  traceExcludedUrls: ['/api/healthz'],
  traceSampleRate: 1,
});
