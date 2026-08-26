import { createCalculatorServer } from './server.js';

// Standalone HTTP entry point for the deliberately isolated calculator service.
const server = createCalculatorServer();
server.listen(Number(process.env.PORT ?? 8080), process.env.HOST ?? '0.0.0.0');
