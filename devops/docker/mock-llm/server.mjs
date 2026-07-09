/**
 * Mock LLM server — OpenAI-compatible streaming server for e2e tests.
 *
 * POST /v1/chat/completions
 *   Echoes the last user message back word-by-word as an SSE stream.
 *   Includes a usage chunk when stream_options.include_usage is true (required
 *   by the @ais-chat/ai-core OpenAI provider).
 *   Output can be controlled by including special commands in the user message.
 *   See `MOCK_LLM_COMMANDS` for supported commands.
 *
 * POST /v1/responses
 *   Streams OpenAI Responses API events for the agentic chat path. Commands can
 *   force deterministic function calls and then print function outputs.
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
  CALL_RETRIEVE_ENTIRE_FILE:
    '[MOCK-LLM-COMMAND: Rufe das Tool retrieve_entire_file auf und gib die Tool-Antwort aus]',
  CALL_RETRIEVE_TEXT_CHUNKS:
    '[MOCK-LLM-COMMAND: Rufe das Tool retrieve_text_chunks auf und gib die Tool-Antwort aus]',
  CALL_WEB_SCRAPER:
    '[MOCK-LLM-COMMAND: Rufe das Tool web_scraper auf und gib die Tool-Antwort aus]',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function readBody(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return body;
}

function writeSse(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function getTextFromContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((p) => p.type === 'text' || p.type === 'input_text')
      .map((p) => p.text)
      .join('');
  }
  return '';
}

function extractLastUserMessage(messages) {
  return getTextFromContent(messages.findLast((msg) => msg.role === 'user')?.content);
}

function extractSystemPrompt(messages) {
  return getTextFromContent(messages.find((msg) => msg.role === 'system')?.content);
}

function extractLastFunctionOutput(input) {
  return input.findLast((item) => item.type === 'function_call_output')?.output ?? '';
}

function extractLastFunctionCall(input) {
  return input.findLast((item) => item.type === 'function_call');
}

function extractLastResponsesUserMessage(input) {
  return getTextFromContent(input.findLast((item) => item.role === 'user')?.content);
}

function extractResponsesSystemPrompt(input) {
  return getTextFromContent(input.find((item) => item.role === 'system')?.content);
}

function extractUrls(text) {
  return text.match(/https?:\/\/[^\s)]+/g) ?? [];
}

function extractFileNameFromSystemPrompt(systemPrompt) {
  const match = systemPrompt.match(/Available files right now:\s*([^\n]+?)\s+\(\d+ bytes\)/i);
  return match?.[1] ?? 'Große Text Datei.txt';
}

function makeUsage(input, outputText) {
  const promptText = JSON.stringify(input);
  const promptTokens = estimateTokens(promptText);
  const completionTokens = estimateTokens(outputText);
  return {
    input_tokens: promptTokens,
    output_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens,
  };
}

function resolveMockToolCall({ systemPrompt, lastUserMessage }) {
  if (lastUserMessage.includes(MOCK_LLM_COMMANDS.CALL_RETRIEVE_ENTIRE_FILE)) {
    return {
      name: 'retrieve_entire_file',
      arguments: JSON.stringify({ fileName: extractFileNameFromSystemPrompt(systemPrompt) }),
    };
  }

  if (lastUserMessage.includes(MOCK_LLM_COMMANDS.CALL_RETRIEVE_TEXT_CHUNKS)) {
    return {
      name: 'retrieve_text_chunks',
      arguments: JSON.stringify({ search: lastUserMessage, limit: 5 }),
    };
  }

  if (lastUserMessage.includes(MOCK_LLM_COMMANDS.CALL_WEB_SCRAPER)) {
    return {
      name: 'web_scraper',
      arguments: JSON.stringify({ urls: extractUrls(lastUserMessage) }),
    };
  }

  return null;
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
  const lastUserMessage = extractLastUserMessage(messages);
  const responseText = lastUserMessage.includes(MOCK_LLM_COMMANDS.RETURN_SYSTEM_PROMPT)
    ? extractSystemPrompt(messages)
    : lastUserMessage;

  const id = `chatcmpl-mock-${Date.now()}`;
  const created = Math.floor(Date.now() / 1000);
  const promptTokens = messages.reduce(
    (sum, m) =>
      sum + estimateTokens(typeof m.content === 'string' ? m.content : JSON.stringify(m.content)),
    0,
  );
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

function writeResponsesHeaders(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Transfer-Encoding': 'chunked',
  });
}

async function streamResponsesText({ res, id, model, responseText, input }) {
  for (const word of responseText.split(/(\s+)/)) {
    writeSse(res, {
      type: 'response.output_text.delta',
      sequence_number: 0,
      item_id: `${id}-message`,
      output_index: 0,
      content_index: 0,
      delta: word,
    });
    await sleep(CHUNK_INTERVAL_MS);
  }

  writeSse(res, {
    type: 'response.completed',
    sequence_number: 1,
    response: {
      id,
      object: 'response',
      created_at: Math.floor(Date.now() / 1000),
      model,
      status: 'completed',
      usage: makeUsage(input, responseText),
    },
  });
  res.end();
}

async function streamResponsesToolCall({ res, id, model, input, toolCall }) {
  const outputIndex = 0;
  const callId = `call_mock_${Date.now()}`;
  const itemId = `fc_mock_${Date.now()}`;

  writeSse(res, {
    type: 'response.function_call_arguments.delta',
    sequence_number: 0,
    item_id: itemId,
    output_index: outputIndex,
    delta: toolCall.arguments,
  });

  writeSse(res, {
    type: 'response.function_call_arguments.done',
    sequence_number: 1,
    item_id: itemId,
    output_index: outputIndex,
    name: toolCall.name,
    arguments: toolCall.arguments,
  });

  writeSse(res, {
    type: 'response.output_item.done',
    sequence_number: 2,
    output_index: outputIndex,
    item: {
      id: itemId,
      type: 'function_call',
      status: 'completed',
      call_id: callId,
      name: toolCall.name,
      arguments: toolCall.arguments,
    },
  });

  writeSse(res, {
    type: 'response.completed',
    sequence_number: 3,
    response: {
      id,
      object: 'response',
      created_at: Math.floor(Date.now() / 1000),
      model,
      status: 'completed',
      usage: makeUsage(input, `${toolCall.name}${toolCall.arguments}`),
    },
  });

  res.end();
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

  const input = data.input ?? [];
  const model = data.model ?? 'mock-echo';
  const id = `resp_mock_${Date.now()}`;
  const systemPrompt = extractResponsesSystemPrompt(input);
  const lastUserMessage = extractLastResponsesUserMessage(input);
  const lastToolOutput = extractLastFunctionOutput(input);
  const lastToolCall = extractLastFunctionCall(input);
  const toolCall = resolveMockToolCall({ systemPrompt, lastUserMessage });

  writeResponsesHeaders(res);

  if (lastToolOutput) {
    await streamResponsesText({
      res,
      id,
      model,
      input,
      responseText: lastToolOutput,
    });
    return;
  }

  if (toolCall) {
    await streamResponsesToolCall({ res, id, model, input, toolCall });
    return;
  }

  const responseText = lastUserMessage.includes(MOCK_LLM_COMMANDS.RETURN_SYSTEM_PROMPT)
    ? systemPrompt
    : lastUserMessage || lastToolCall?.arguments || '';

  await streamResponsesText({ res, id, model, input, responseText });
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
