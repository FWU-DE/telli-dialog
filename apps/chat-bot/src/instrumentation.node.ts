import { initSentry } from '@shared/sentry/server-init';

initSentry({
  serviceName: 'ais-chat-app',
  traceExcludedUrls: ['/api/healthz'],
});
