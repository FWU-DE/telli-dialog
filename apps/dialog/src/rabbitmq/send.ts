import { trace } from '@opentelemetry/api';
import { Connection } from 'rabbitmq-client';
import { logDebug, logError } from '@shared/logging';
import { env } from '@/env';

const tracer = trace.getTracer('rabbitmq-client');

const rabbit = new Connection(env.rabbitmqUri);

const publisher = rabbit.createPublisher({ confirm: true });

export async function sendRabbitmqEvent(event: object) {
  // Do not await published event for performance reasons
  void tracer.startActiveSpan('sendRabbitmqEvent', async (span) => {
    logDebug('Sending RabbitMq event...', { event });
    try {
      await publisher.send({ routingKey: 'events', exchange: '' }, event);
    } catch (error) {
      logError('Sending event to RabbitMq failed', error);
    }
    span.end();
  });
}
