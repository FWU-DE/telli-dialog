/**
 * Mock LLM server — OpenAI-compatible streaming echo server for e2e tests.
 *
 * POST /v1/chat/completions
 * POST /v1/responses
 *   Echoes the last user message back word-by-word as a stream.
 *   Includes a usage chunk when stream_options.include_usage is true (required
 *   by the @ais-chat/ai-core OpenAI provider).
 *   Output can be controlled by including special commands in the user message.
 *   See `MOCK_LLM_COMMANDS` for supported commands.
 *   The Responses endpoint can emit deterministic tool calls for agentic e2e tests.
 *
 * POST /v1/embeddings
 *   Returns deterministic 1024-dimensional embeddings.
 *
 * POST /v1/images/generations
 *   Returns a deterministic 1x1 PNG image.
 *
 * GET /health
 *   Returns {"status":"healthy"} for readiness checks.
 */

import http from 'node:http';

const PORT = 6556;
const CHUNK_INTERVAL_MS = 1;

// Must match MOCK_LLM_COMMANDS in apps/chat-bot/e2e/utils/const.ts
const MOCK_LLM_COMMANDS = {
  RETURN_SYSTEM_PROMPT: '[MOCK-LLM-COMMAND: Gebe den System-Prompt aus]',
};

const EMPTY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l2cL9wAAAABJRU5ErkJggg==';
const MOCK_EMBEDDING_DIMENSIONS = 1024;

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
  const content = messages.findLast((msg) => msg.role === 'user')?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((p) => p.type === 'text')
      .map((p) => p.text)
      .join('');
  }
  return '';
}

function extractSystemPrompt(messages) {
  const content = messages.find((msg) => msg.role === 'system')?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((p) => p.type === 'text')
      .map((p) => p.text)
      .join('');
  }
  return '';
}

function combineToolOutputs(messages) {
  return messages
    .filter((msg) => msg.role === 'tool' || msg.type === 'function_call_output')
    .map((msg) => msg.content ?? msg.output ?? '')
    .filter(Boolean)
    .join('\n');
}

function estimateTokens(text) {
  return Math.max(1, Math.ceil(text.length / 4));
}

function estimateMessagesTokens(messages) {
  return messages.reduce(
    (sum, m) =>
      sum + estimateTokens(typeof m.content === 'string' ? m.content : JSON.stringify(m.content)),
    0,
  );
}

function getResponseText(messages) {
  const lastUserMessage = extractLastUserMessage(messages);
  if (!lastUserMessage.includes(MOCK_LLM_COMMANDS.RETURN_SYSTEM_PROMPT)) return lastUserMessage;

  return [extractSystemPrompt(messages), combineToolOutputs(messages)].filter(Boolean).join('\n');
}

function extractUrl(text) {
  // E2E prompts use plain URLs separated by whitespace; trim prose punctuation around them.
  const match = text.match(/https?:\/\/\S+/);
  return match ? match[0].replace(/[),.!?'"]+$/, '') : undefined;
}

function getAvailableTool(tools, name) {
  return tools?.find((tool) => tool.name === name || tool.function?.name === name);
}

function extractFirstFileName(tools) {
  const tool = getAvailableTool(tools, 'retrieve_entire_file');
  const description = tool?.description ?? tool?.function?.description ?? '';
  // This mirrors the retrieve_entire_file description format in
  // apps/chat-bot/src/app/api/chat/build-tools.ts; keep it in sync so the mock
  // can choose a deterministic file for agentic E2E tests.
  const fileList = description.match(
    /Available files right now:\s*(.+?)(?:\. Use this tool|$)/,
  )?.[1];
  return fileList
    ?.split('), ')[0]
    ?.replace(/\s+\([^)]*$/, '')
    .trim();
}

function getDeterministicToolCall(data) {
  const messages = data.input ?? data.messages ?? [];
  const tools = data.tools ?? [];
  const hasToolOutput = messages.some(
    (msg) => msg.role === 'tool' || msg.type === 'function_call_output',
  );
  const lastUserMessage = extractLastUserMessage(messages);

  if (hasToolOutput) return undefined;

  const fileName = extractFirstFileName(tools);
  if (fileName) {
    return {
      name: 'retrieve_entire_file',
      arguments: JSON.stringify({ fileName }),
    };
  }

  const url = extractUrl(lastUserMessage);
  if (url && getAvailableTool(tools, 'web_scraper')) {
    return {
      name: 'web_scraper',
      arguments: JSON.stringify({ url }),
    };
  }

  return undefined;
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
  const responseText = getResponseText(messages);

  const id = `chatcmpl-mock-${Date.now()}`;
  const created = Math.floor(Date.now() / 1000);
  const promptTokens = estimateMessagesTokens(messages);
  const completionTokens = estimateTokens(responseText);
  const totalTokens = promptTokens + completionTokens;

  if (isStream) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Transfer-Encoding': 'chunked',
    });

    for (const word of responseText.split(/(\s+)/)) {
      writeSse(res, makeSseChunk(id, model, created, word, null));
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

async function handleResponses(req, res) {
  let data;
  try {
    data = JSON.parse(await readBody(req));
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const messages = data.input ?? [];
  const model = data.model ?? 'mock-echo';
  const id = `resp_mock_${Date.now()}`;
  const created = Math.floor(Date.now() / 1000);
  const promptTokens = estimateMessagesTokens(messages);
  const toolCall = getDeterministicToolCall(data);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Transfer-Encoding': 'chunked',
  });

  if (toolCall) {
    const callId = `call_mock_${Date.now()}`;
    writeSse(res, {
      type: 'response.function_call_arguments.delta',
      output_index: 0,
      delta: toolCall.arguments,
    });
    writeSse(res, {
      type: 'response.function_call_arguments.done',
      output_index: 0,
      name: toolCall.name,
      arguments: toolCall.arguments,
    });
    writeSse(res, {
      type: 'response.output_item.done',
      output_index: 0,
      item: {
        type: 'function_call',
        id: callId,
        call_id: callId,
        name: toolCall.name,
        arguments: toolCall.arguments,
      },
    });
    writeSse(res, {
      type: 'response.completed',
      response: {
        id,
        model,
        created_at: created,
        usage: {
          input_tokens: promptTokens,
          output_tokens: estimateTokens(toolCall.arguments),
          total_tokens: promptTokens + estimateTokens(toolCall.arguments),
        },
      },
    });
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  const responseText = getResponseText(messages);
  for (const word of responseText.split(/(\s+)/)) {
    writeSse(res, {
      type: 'response.output_text.delta',
      delta: word,
    });
    await sleep(CHUNK_INTERVAL_MS);
  }

  writeSse(res, {
    type: 'response.completed',
    response: {
      id,
      model,
      created_at: created,
      usage: {
        input_tokens: promptTokens,
        output_tokens: estimateTokens(responseText),
        total_tokens: promptTokens + estimateTokens(responseText),
      },
    },
  });
  res.write('data: [DONE]\n\n');
  res.end();
}

async function handleEmbeddings(req, res) {
  let data;
  try {
    data = JSON.parse(await readBody(req));
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const inputs = Array.isArray(data.input) ? data.input : [data.input ?? ''];
  const embedding = Array.from({ length: MOCK_EMBEDDING_DIMENSIONS }, (_, index) =>
    index === 0 ? 1 : 0,
  );
  const promptTokens = inputs.reduce((sum, input) => sum + estimateTokens(String(input)), 0);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      object: 'list',
      data: inputs.map((_, index) => ({
        object: 'embedding',
        index,
        embedding,
      })),
      model: data.model ?? 'mock-embedding',
      usage: {
        prompt_tokens: promptTokens,
        total_tokens: promptTokens,
      },
    }),
  );
}

async function handleImageGenerations(req, res) {
  let data;
  try {
    data = JSON.parse(await readBody(req));
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      created: Math.floor(Date.now() / 1000),
      data: [{ b64_json: EMPTY_PNG_BASE64 }],
      output_format: 'png',
      usage: {
        input_text_tokens: estimateTokens(data.prompt ?? ''),
        output_image_tokens: 1,
      },
    }),
  );
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

    if (req.method === 'POST' && req.url === '/v1/responses') {
      await handleResponses(req, res);
      return;
    }

    if (req.method === 'POST' && req.url === '/v1/embeddings') {
      await handleEmbeddings(req, res);
      return;
    }

    if (req.method === 'POST' && req.url === '/v1/images/generations') {
      await handleImageGenerations(req, res);
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
