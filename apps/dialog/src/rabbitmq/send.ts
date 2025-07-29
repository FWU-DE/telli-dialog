import { Connection } from 'rabbitmq-client';

const rabbitmqUri = process.env['RABBITMQ_URI'];

if (rabbitmqUri === undefined) {
  throw Error('Expected process.env.RABBITMQ_URI to be defined');
}

const rabbit = new Connection(rabbitmqUri);

const publisher = rabbit.createPublisher({ confirm: true });

export async function sendRabbitmqEvent(event: object) {
  console.info('Sending event...', event);
  await publisher.send({ routingKey: 'events', exchange: '' }, event);
}
