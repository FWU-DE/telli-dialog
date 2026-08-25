import { createQalcServer } from './server.js';

const server = createQalcServer();
server.listen(Number(process.env.PORT ?? 8080), process.env.HOST ?? '0.0.0.0');
