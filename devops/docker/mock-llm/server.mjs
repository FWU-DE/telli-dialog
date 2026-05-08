/**
 * Mock LLM server — OpenAI-compatible streaming echo server for e2e tests.
 *
 * POST /v1/chat/completions
 *   Echoes the last user message back character-by-character as an SSE stream.
 *   Includes a usage chunk when stream_options.include_usage is true (required
 *   by the @telli/ai-core OpenAI provider).
 *
 * GET /health
 *   Returns {"status":"healthy"} for readiness checks.
 */

import http from 'node:http';

const PORT = 6556;
const CHUNK_INTERVAL_MS = 5;

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

function makeSseChunk(id, model, deltaContent, finishReason) {
  return {
    id,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
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
  let body = '';
  for await (const chunk of req) body += chunk;

  let data;
  try {
    data = JSON.parse(body);
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
      const chunk = makeSseChunk(id, model, char, null);
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, CHUNK_INTERVAL_MS));
    }

    // Final chunk with finish_reason = 'stop'
    const finishChunk = makeSseChunk(id, model, null, 'stop');
    res.write(`data: ${JSON.stringify(finishChunk)}\n\n`);

    // Usage chunk — required by @telli/ai-core when stream_options.include_usage=true
    if (includeUsage) {
      const usageChunk = {
        id,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
        },
      };
      res.write(`data: ${JSON.stringify(usageChunk)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } else {
    const response = {
      id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
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
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
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
