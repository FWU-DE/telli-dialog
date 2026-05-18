/**
 * Mock LLM server — OpenAI-compatible streaming echo server for e2e tests.
 *
 * POST /v1/chat/completions
 *   Echoes the last user message back character-by-character as an SSE stream.
 *   Includes a usage chunk when stream_options.include_usage is true (required
 *   by the @ais-chat/ai-core OpenAI provider).
 *
 * GET /health
 *   Returns {"status":"healthy"} for readiness checks.
 */

import http from 'node:http';

const PORT = 6556;
const CHUNK_INTERVAL_MS = 5;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function readBody(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return body;
}

function writeSse(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function extractLastUserMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'user') {
      const content = msg.content;
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        return content
          .filter((p) => p.type === 'text')
          .map((p) => p.text)
          .join('');
      }
    }
  }
  return '';
}

function estimateTokens(text) {
  return Math.max(1, Math.ceil(text.length / 4));
}

function makeSseChunk(id, model, created, deltaContent, finishReason) {
  return {
    id,
    object: 'chat.completion.chunk',
    created,
    model,
    choices: [
      {
        index: 0,
        delta: deltaContent !== null ? { content: deltaContent } : {},
        finish_reason: finishReason ?? null,
        logprobs: null,
      },
    ],
  };
}

async function handleChatCompletions(req, res) {
  let data;
  try {
    data = JSON.parse(await readBody(req));
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const messages = data.messages ?? [];
  const model = data.model ?? 'mock-echo';
  const isStream = data.stream === true;
  const includeUsage = data.stream_options?.include_usage === true;
  const responseText = extractLastUserMessage(messages);

  const id = `chatcmpl-mock-${Date.now()}`;
  const created = Math.floor(Date.now() / 1000);
  const promptTokens = messages.reduce(
    (sum, m) =>
      sum +
      estimateTokens(typeof m.content === 'string' ? m.content : JSON.stringify(m.content)),
    0,
  );
  const completionTokens = estimateTokens(responseText);
  const totalTokens = promptTokens + completionTokens;

  if (isStream) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Transfer-Encoding': 'chunked',
    });

    for (const char of responseText) {
      writeSse(res, makeSseChunk(id, model, created, char, null));
      await sleep(CHUNK_INTERVAL_MS);
    }

    writeSse(res, makeSseChunk(id, model, created, null, 'stop'));

    if (includeUsage) {
      writeSse(res, {
        id,
        object: 'chat.completion.chunk',
        created,
        model,
        choices: [],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
        },
      });
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        id,
        object: 'chat.completion',
        created,
        model,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: responseText, refusal: null },
            finish_reason: 'stop',
            logprobs: null,
          },
        ],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
        },
      }),
    );
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy' }));
      return;
    }

    if (req.method === 'POST' && req.url === '/v1/chat/completions') {
      await handleChatCompletions(req, res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (err) {
    console.error('Unhandled error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
});

server.listen(PORT, () => {
  console.log(`Mock LLM server listening on port ${PORT}`);
});
