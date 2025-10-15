import { trace } from '@opentelemetry/api';
import { Connection } from 'rabbitmq-client';

const rabbitmqUri = process.env['RABBITMQ_URI'];

if (rabbitmqUri === undefined) {
  throw Error('Expected process.env.RABBITMQ_URI to be defined');
}

const tracer = trace.getTracer('rabbitmq-client');

const rabbit = new Connection(rabbitmqUri);

const publisher = rabbit.createPublisher({ confirm: true });

export async function sendRabbitmqEvent(event: object) {
  await tracer.startActiveSpan('sendRabbitmqEvent', async (span) => {
    console.info('Sending event...', event);
    await publisher.send({ routingKey: 'events', exchange: '' }, event);
    span.end();
  });
}
