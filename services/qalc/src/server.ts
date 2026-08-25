import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { DEFAULT_LIMITS, parseJsonBody, validateRequest } from './validation.js';
import { WorkerPool } from './pool.js';
import type { Limits, Result } from './types.js';

const statusCodes: Record<Result['status'], number> = {
  success: 200,
  invalid_input: 400,
  overload: 429,
  timeout: 504,
  crashed_worker: 502,
  malformed_output: 502,
  upstream_failure: 503,
  internal_failure: 500,
};
function send(response: ServerResponse, result: Result): void {
  if (response.destroyed || response.writableEnded) return;
  response.writeHead(statusCodes[result.status], { 'content-type': 'application/json' });
  response.end(JSON.stringify(result));
}

export function createQalcServer(limits: Limits = DEFAULT_LIMITS) {
  return createQalcServerWithPool(limits, new WorkerPool(limits));
}

export function createQalcServerWithPool(limits: Limits, pool: Pick<WorkerPool, 'run'>) {
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    const rejectBody = (error: string) => {
      request.resume();
      send(response, { status: 'invalid_input', error });
    };
    if (request.method === 'GET' && request.url === '/healthz')
      return send(response, { status: 'success', result: 'ok' });
    if (request.method !== 'POST' || request.url !== '/v1/calculate')
      return send(response, { status: 'invalid_input', error: 'not found' });
    if (request.headers['content-type']?.split(';', 1)[0] !== 'application/json')
      return rejectBody('content-type must be application/json');
    const contentLength = request.headers['content-length'];
    if (
      contentLength !== undefined &&
      (!/^\d+$/.test(contentLength) || Number(contentLength) > limits.maxBodyBytes)
    )
      return rejectBody('body too large');
    const controller = new AbortController();
    const onRequestClose = () => {
      if (!request.complete) controller.abort();
    };
    const onResponseClose = () => {
      if (!response.writableEnded) controller.abort();
    };
    request.once('close', onRequestClose);
    response.once('close', onResponseClose);
    let body = '';
    let bytes = 0;
    let done = false;
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => {
      if (done) return;
      bytes += Buffer.byteLength(chunk);
      if (bytes > limits.maxBodyBytes) {
        done = true;
        send(response, { status: 'invalid_input', error: 'body too large' });
        request.resume();
        return;
      }
      body += chunk;
    });
    const finish = async () => {
      if (done || controller.signal.aborted) return;
      done = true;
      const input = parseJsonBody(body);
      const error = validateRequest(input, limits);
      if (error) return send(response, { status: 'invalid_input', error });
      const result = await pool.run((input as { expression: string }).expression, {
        signal: controller.signal,
      });
      send(response, result);
    };
    request.once('end', () => void finish());
    request.once('error', () => {
      done = true;
      controller.abort();
    });
  });
  server.requestTimeout = limits.wallTimeMs + 5000;
  server.headersTimeout = 5000;
  server.keepAliveTimeout = 5000;
  return server;
}
