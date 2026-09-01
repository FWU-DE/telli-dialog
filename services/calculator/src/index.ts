import { createCalculatorServer } from './server.js';

// Standalone HTTP entry point for the deliberately isolated calculator service.
const server = createCalculatorServer();

void server
  .listen({ port: Number(process.env.PORT ?? 8080), host: process.env.HOST ?? '0.0.0.0' })
  .catch(() => {
    process.stderr.write('calculator server failed to start\n');
    process.exitCode = 1;
  });
