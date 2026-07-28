import { initSentry } from '@shared/sentry/server-init';

initSentry({
  serviceName: 'ais-chat-admin',
  traceExcludedUrls: ['/api/healthz'],
});
